import mongoose from "mongoose";
import User from "../../models/User.js";
import Chat from "../../models/Chat.js";
import Message from "../../models/Message.js";
import { generateToken } from "../../middleware/auth.js";
import cloudinary from "../../config/cloudinary.js";
import { AuthenticationError, UserInputError } from "apollo-server-express";
import { withFilter } from "graphql-subscriptions";
import DOMPurify from "isomorphic-dompurify";

const resolvers = {

    Query: {
        me: async (parent, args, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            return user;
        },

        getUser: async (parent, { id }, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            return await User.findById(id);
        },

        getUsers: async (parent, { search }, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            if (search && search.length < 2) {
                throw new UserInputError("Search term too short");
            }
            const query = search
                ? {
                    $or: [
                        { username: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                    ],
                    _id: { $ne: user._id },
                }
                : { _id: { $ne: user._id } };
            return await User.find(query).limit(20);
        },

        getChats: async (parent, args, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            return await Chat.find({
                participants: { $in: [user._id] },
            })
                .populate("participants")
                .populate("lastMessage")
                .populate("groupAdmin")
                .sort({ updatedAt: -1 });
        },

        getChat: async (parent, { id }, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const chat = await Chat.findOne({
                _id: id,
                participants: { $in: [user._id] },
            })
                .populate("participants")
                .populate("lastMessage")
                .populate("groupAdmin");
            if (!chat) throw new UserInputError("Chat not found");
            return chat;
        },

        getMessages: async (parent, { chatId, limit = 50, offset = 0 }, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const chat = await Chat.findOne({
                _id: chatId,
                participants: { $in: [user._id] },
            });
            if (!chat) throw new UserInputError("Chat not found");
            return await Message.find({ chat: chatId })
                .populate("sender")
                .populate("chat")
                .populate("readBy.user")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);
        },

        cloudinarySignature: async () => {
            const timestamp = Math.round(Date.now() / 1000);
            const signature = cloudinary.utils.api_sign_request(
                {
                    timestamp,
                    folder: "chat_uploads",
                },
                process.env.CLOUDINARY_API_SECRET
            );
            return {
                signature,
                timestamp,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: process.env.CLOUDINARY_API_KEY,
            };
        },
    },

    Mutation: {
        register: async (parent, { username, email, password }) => {
            try {
                const existingUser = await User.findOne({
                    $or: [{ email }, { username }],
                });

                if (existingUser) {
                    if (existingUser.email === email) throw new UserInputError("Email already in use");
                    if (existingUser.username === username) throw new UserInputError("Username already in use");
                }

                const user = await User.create({ username, email, password });
                const token = generateToken(user._id);

                return { token, user };
            } catch (error) {
                throw new Error("Registration failed: " + error.message);
            }
        },

        login: async (parent, { email, password }) => {
            try {
                const user = await User.findOne({ email });

                if (!user || !(await user.matchPassword(password))) {
                    throw new AuthenticationError("Invalid credentials");
                }

                user.isOnline = true;
                await user.save();

                const token = generateToken(user._id);

                return { token, user };
            } catch (error) {
                throw new Error("Login failed: " + error.message);
            }
        },

        updateProfile: async (parent, { username, avatar }, { user, pubsub }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const updateData = {};
            if (username && username !== user.username) {
                const existingUser = await User.findOne({ username: username.toLowerCase() });
                if (existingUser) {
                    throw new UserInputError("Username already in use");
                }
                updateData.username = username;
            }
            if (avatar !== undefined) {
                updateData.avatar = avatar;
            }
            if (Object.keys(updateData).length === 0) {
                return user;
            }
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { $set: updateData },
                { new: true }
            );
            if (pubsub) {
                pubsub.publish("USER_STATUS_CHANGED", {
                    userStatusChanged: updatedUser,
                });
            }
            return updatedUser;
        },

        createChat: async (parent, { participantIds, name, isGroupChat = false }, { user, io }) => {
            if (!user) throw new AuthenticationError("Not authenticated");

            if (!isGroupChat && participantIds.length !== 1) {
                throw new UserInputError(
                    "Direct chat must have exactly one participant"
                );
            }

            const participantObjectIds = participantIds.map(
                (id) => new mongoose.Types.ObjectId(id)
            );
            const userObjectId = user._id;

            const allParticipants = [...participantObjectIds, userObjectId];
            const uniqueParticipants = [
                ...new Set(allParticipants.map((id) => id.toString())),
            ].map((id) => new mongoose.Types.ObjectId(id));

            if (!isGroupChat) {
                const existingChat = await Chat.findOne({
                    isGroupChat: false,
                    participants: {
                        $all: uniqueParticipants,
                        $size: uniqueParticipants.length,
                    },
                });

                if (existingChat) {
                    return await Chat.findById(existingChat._id)
                        .populate("participants")
                        .populate("lastMessage")
                        .populate("groupAdmin");
                }
            }

            const chat = await Chat.create({
                name: isGroupChat ? name : null,
                isGroupChat,
                participants: uniqueParticipants,
                groupAdmin: isGroupChat ? user._id : null,
            });

            const populatedChat = await Chat.findById(chat._id)
                .populate("participants")
                .populate("lastMessage")
                .populate("groupAdmin");

            if (io) {
                if (isGroupChat) {
                    name;
                }
                populatedChat.participants.forEach((participant) => {
                    io.to(`user-${participant._id}`).emit("new-chat", populatedChat.toJSON());
                });
            }

            return populatedChat;
        },

        leaveChat: async (parent, { chatId }, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");

            const chat = await Chat.findById(chatId);
            if (!chat) throw new UserInputError("Chat not found");

            chat.participants = chat.participants.filter(
                (p) => p.toString() !== user._id.toString()
            );
            await chat.save();

            return await Chat.findById(chatId)
                .populate("participants")
                .populate("lastMessage")
                .populate("groupAdmin");
        },

        sendMessage: async (parent, { chatId, content, fileUrl, fileType, fileName }, { user, pubsub, io }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const chat = await Chat.findOne({
                _id: chatId,
                participants: { $in: [user._id] },
            });
            if (!chat) throw new UserInputError("Chat not found");

            if (!content && !fileUrl) {
                throw new UserInputError("Message must have content or a file");
            }

            const safeContent = content ? DOMPurify.sanitize(content) : undefined;
            const createdMessage = await Message.create({
                sender: user._id,
                content: safeContent,
                fileUrl,
                fileType,
                fileName,
                chat: chatId,
                readBy: [{ user: user._id, readAt: new Date() }],
            });
            chat.lastMessage = createdMessage._id;
            await chat.save();

            const populatedMessage = await Message.findById(createdMessage._id)
                .populate("sender")
                .populate("chat")
                .populate("readBy.user");
            if (pubsub) {
                pubsub.publish(`MESSAGE_ADDED_${chatId}`, {
                    messageAdded: populatedMessage,
                    chatId: chatId,
                });
            }
            if (io) {
                io.to(`chat-${chatId}`).emit("new-message", {
                    chatId,
                    message: populatedMessage.toJSON(),
                });
            }
            return populatedMessage;
        },

        markAsRead: async (parent, { messageId }, { user, io }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const message = await Message.findById(messageId);
            if (!message) throw new UserInputError("Message not found");
            const alreadyRead = message.readBy.some(
                (r) => r.user.toString() === user._id.toString()
            );
            if (!alreadyRead) {
                message.readBy.push({ user: user._id, readAt: new Date() });
                await message.save();
            }
            const populatedMessage = await Message.findById(messageId)
                .populate("sender")
                .populate("chat")
                .populate("readBy.user");
            if (io && message.chat) {
                io.to(`chat-${message.chat}`).emit("message-read", {
                    chatId: message.chat.toString(),
                    messageId: message._id.toString(),
                    userId: user._id.toString(),
                    readBy: populatedMessage.toJSON().readBy,
                });
            }
            return populatedMessage;
        },

        markAsDelivered: async (parent, { messageId }, { user, io }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const message = await Message.findById(messageId);
            if (!message) throw new UserInputError("Message not found");

            if (message.status === "sent" && message.sender.toString() !== user._id.toString()) {
                message.status = "delivered";
                await message.save();

                const populatedMessage = await Message.findById(messageId)
                    .populate("sender")
                    .populate("chat")
                    .populate("readBy.user");

                if (io && message.chat) {
                    io.to(`chat-${message.chat}`).emit("message-delivered", {
                        chatId: message.chat.toString(),
                        messageId: message._id.toString(),
                        userId: user._id.toString(),
                        status: "delivered"
                    });
                }
                return populatedMessage;
            }

            return await Message.findById(messageId)
                .populate("sender")
                .populate("chat")
                .populate("readBy.user");
        },
    },

    Subscription: {
        messageAdded: {
            subscribe: withFilter(
                (parent, { chatId }, { pubsub, user }) => {
                    if (!user) throw new AuthenticationError("Not authenticated");
                    return pubsub.asyncIterator(`MESSAGE_ADDED_${chatId}`);
                },
                async (payload, variables, { user }) => {
                    const chat = await Chat.findOne({
                        _id: variables.chatId,
                        participants: { $in: [user._id] },
                    });
                    return !!chat;
                }
            ),
        },

        typingStatus: {
            subscribe: withFilter(
                (parent, { chatId }, { pubsub, user }) => {
                    if (!user) throw new AuthenticationError("Not authenticated");
                    return pubsub.asyncIterator(`TYPING_${chatId}`);
                },
                async (payload, variables, { user }) => {
                    const chat = await Chat.findOne({
                        _id: variables.chatId,
                        participants: { $in: [user._id] },
                    });
                    return !!chat;
                }
            ),
        },

        userStatusChanged: {
            subscribe: withFilter(
                (parent, args, { pubsub, user }) => {
                    if (!user) throw new AuthenticationError("Not authenticated");
                    return pubsub.asyncIterator("USER_STATUS_CHANGED");
                },
                async (payload, variables, { user }) => {
                    const chats = await Chat.find({
                        participants: { $in: [user._id] },
                    }).select("_id participants");

                    return chats.some((chat) =>
                        chat.participants.includes(payload.userStatusChanged._id)
                    );
                }
            ),
        },

        chatUpdated: {
            subscribe: (parent, args, { pubsub, user }) => {
                if (!user) throw new AuthenticationError("Not authenticated");
                return pubsub.asyncIterator("CHAT_UPDATED");
            },
        },
    },
};

resolvers.User = {
    id: (user) => (user.id ? user.id : user._id ? user._id.toString() : null),
    lastSeen: (user) => (user.lastSeen ? user.lastSeen.toISOString() : null),
    createdAt: (user) => (user.createdAt ? user.createdAt.toISOString() : null),
    updatedAt: (user) => (user.updatedAt ? user.updatedAt.toISOString() : null),
};

resolvers.Chat = {
    id: (chat) => (chat.id ? chat.id : chat._id ? chat._id.toString() : null),
    createdAt: (chat) => (chat.createdAt ? chat.createdAt.toISOString() : null),
    updatedAt: (chat) => (chat.updatedAt ? chat.updatedAt.toISOString() : null),
    messageStatus: async (chat, args, { user }) => {
        try {
            let chatDoc = chat;
            if (!chatDoc.participants) {
                chatDoc = await Chat.findById(chat._id).populate("participants");
            }
            const lastMessageId = chatDoc.lastMessage?._id
                ? chatDoc.lastMessage._id
                : chatDoc.lastMessage;
            if (!lastMessageId) return chatDoc.messageStatus || "sent";
            const lastMsg = await Message.findById(lastMessageId)
                .populate("readBy.user")
                .populate("sender");
            if (!lastMsg) return chatDoc.messageStatus || "sent";
            const participantIds = (chatDoc.participants || []).map((p) =>
                p._id ? p._id.toString() : p.toString()
            );
            const senderId = lastMsg.sender?._id
                ? lastMsg.sender._id.toString()
                : lastMsg.sender?.toString();
            const readUserIds = (lastMsg.readBy || [])
                .map((r) =>
                    r.user
                        ? r.user._id
                            ? r.user._id.toString()
                            : r.user.toString()
                        : null
                )
                .filter(Boolean);
            const otherParticipantIds = participantIds.filter(
                (id) => id !== senderId
            );
            const allRead =
                otherParticipantIds.length > 0 &&
                otherParticipantIds.every((id) => readUserIds.includes(id));
            if (allRead) return "read";
            if (lastMsg.status === "delivered" || readUserIds.length > 0) return "delivered";

            return "sent";
        } catch (err) {
            return chat.messageStatus || "sent";
        }
    },
    unreadCount: async (chat, args, { user }) => {
        if (!user) return 0;
        try {
            const count = await Message.countDocuments({
                chat: chat._id,
                sender: { $ne: user._id },
                "readBy.user": { $ne: user._id },
            });
            return count || 0;
        } catch (err) {
            return 0;
        }
    },
};

resolvers.Message = {
    id: (msg) => (msg.id ? msg.id : msg._id ? msg._id.toString() : null),
    createdAt: (msg) => (msg.createdAt ? msg.createdAt.toISOString() : null),
    updatedAt: (msg) => (msg.updatedAt ? msg.updatedAt.toISOString() : null),
    sender: (msg) => {
        return msg.sender;
    },
};

export default resolvers;