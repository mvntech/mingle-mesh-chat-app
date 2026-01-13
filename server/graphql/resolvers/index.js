import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import DOMPurify from "isomorphic-dompurify";
import { withFilter } from "graphql-subscriptions";
import User from "../../models/User.js";
import Chat from "../../models/Chat.js";
import Message from "../../models/Message.js";
import { generateToken } from "../../middleware/auth.js";
import cloudinary from "../../config/cloudinary.js";

const resolvers = {

    Query: {
        me: async (parent, args, { user }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            return user;
        },

        getUser: async (parent, { id }, { user }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            return await User.findById(id);
        },

        getUsers: async (parent, args, { user }) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            const { search, limit = 20, offset = 0 } = args;
            if (search && search.length < 2) {
                throw new GraphQLError("Search term too short", { extensions: { code: 'BAD_USER_INPUT' } });
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
            return await User.find(query).skip(offset).limit(limit);
        },

        getChats: async (parent, args, { user }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const chats = await Chat.find({
                participants: { $in: [user._id] },
                deletedBy: { $ne: user._id },
            })
                .populate("participants")
                .populate({
                    path: "lastMessage",
                    populate: [
                        { path: "sender" },
                        { path: "readBy.user" }
                    ]
                })
                .populate("groupAdmin")
                .sort({ updatedAt: -1 });
            const chatIds = chats.map(c => c._id);
            const unreadCounts = await Message.aggregate([
                {
                    $match: {
                        chat: { $in: chatIds },
                        sender: { $ne: user._id },
                        "readBy.user": { $ne: user._id }
                    }
                },
                {
                    $group: {
                        _id: "$chat",
                        count: { $sum: 1 }
                    }
                }
            ]);
            const countMap = {};
            unreadCounts.forEach(c => {
                countMap[c._id.toString()] = c.count;
            });
            chats.forEach(chat => {
                chat._unreadCount = countMap[chat._id.toString()] || 0;
            });
            return chats;
        },

        getChat: async (parent, { id }, { user }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const chat = await Chat.findOne({
                _id: id,
                participants: { $in: [user._id] },
            })
                .populate("participants")
                .populate({
                    path: "lastMessage",
                    populate: [
                        { path: "sender" },
                        { path: "readBy.user" }
                    ]
                })
                .populate("groupAdmin");
            if (!chat) throw new GraphQLError("Chat not found", { extensions: { code: 'BAD_USER_INPUT' } });
            return chat;
        },

        getMessages: async (parent, { chatId, limit = 50, offset = 0 }, { user }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const chat = await Chat.findOne({
                _id: chatId,
                participants: { $in: [user._id] },
            });
            if (!chat) throw new GraphQLError("Chat not found", { extensions: { code: 'BAD_USER_INPUT' } });
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
            if (username.length < 3 || username.length > 30) throw new GraphQLError("Username must be between 3 and 30 characters", { extensions: { code: 'BAD_USER_INPUT' } });
            if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new GraphQLError("Username can only contain letters, numbers, and underscores", { extensions: { code: 'BAD_USER_INPUT' } });
            if (password.length < 6) throw new GraphQLError("Password must be at least 6 characters", { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                const existingUser = await User.findOne({
                    $or: [{ email }, { username }],
                });
                if (existingUser) {
                    if (existingUser.email === email) throw new GraphQLError("Email already in use", { extensions: { code: 'BAD_USER_INPUT' } });
                    if (existingUser.username === username) throw new GraphQLError("Username already in use", { extensions: { code: 'BAD_USER_INPUT' } });
                }
                const user = await User.create({ username, email, password });
                const token = generateToken(user._id);

                return { token, user };
            } catch (error) {
                throw new Error(error.message);
            }
        },

        login: async (parent, { email, password }) => {
            try {
                const user = await User.findOne({ email });

                if (!user || !(await user.matchPassword(password))) {
                    throw new GraphQLError("Invalid credentials", { extensions: { code: 'UNAUTHENTICATED' } });
                }
                user.isOnline = true;
                await user.save();
                const token = generateToken(user._id);
                return { token, user };
            } catch (error) {
                throw new Error(error.message);
            }
        },

        updateProfile: async (parent, { username, avatar }, { user, pubsub }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const updateData = {};
            if (username && username !== user.username) {
                const existingUser = await User.findOne({ username: username.toLowerCase() });
                if (existingUser) {
                    throw new GraphQLError("Username already in use", { extensions: { code: 'BAD_USER_INPUT' } });
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
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });

            if (!isGroupChat && participantIds.length !== 1) {
                throw new GraphQLError("Direct chat must have exactly one participant", { extensions: { code: 'BAD_USER_INPUT' } });
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
                    if (existingChat.deletedBy.includes(user._id)) {
                        existingChat.deletedBy.pull(user._id);
                        await existingChat.save();
                    }
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
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const chat = await Chat.findById(chatId);
            if (!chat) throw new GraphQLError("Chat not found", { extensions: { code: 'BAD_USER_INPUT' } });
            if (chat.isGroupChat) {
                chat.participants = chat.participants.filter(
                    (p) => p.toString() !== user._id.toString()
                );
            } else {
                if (!chat.deletedBy.includes(user._id)) {
                    chat.deletedBy.push(user._id);
                }
            }
            await chat.save();
            return await Chat.findById(chatId)
                .populate("participants")
                .populate("lastMessage")
                .populate("groupAdmin");
        },

        sendMessage: async (parent, { chatId, content, fileUrl, fileType, fileName }, { user, pubsub, io }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            if (content && content.length > 5000) throw new GraphQLError("Message too long", { extensions: { code: 'BAD_USER_INPUT' } });
            if (fileUrl && !/^https?:\/\//.test(fileUrl)) throw new GraphQLError("Invalid file URL", { extensions: { code: 'BAD_USER_INPUT' } });
            const chat = await Chat.findOne({
                _id: chatId,
                participants: { $in: [user._id] },
            });
            if (!chat) throw new GraphQLError("Chat not found", { extensions: { code: 'BAD_USER_INPUT' } });

            if (!content && !fileUrl) {
                throw new GraphQLError("Message must have content or a file", { extensions: { code: 'BAD_USER_INPUT' } });
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
            chat.deletedBy = [];
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
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            let populatedMessage = await Message.findOneAndUpdate(
                { _id: messageId, "readBy.user": { $ne: user._id } },
                { $push: { readBy: { user: user._id, readAt: new Date() } } },
                { new: true }
            )
                .populate("sender")
                .populate("chat")
                .populate("readBy.user");

            if (!populatedMessage) {
                populatedMessage = await Message.findById(messageId)
                    .populate("sender")
                    .populate("chat")
                    .populate("readBy.user");
                if (!populatedMessage) throw new GraphQLError("Message not found within read context", { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (io && populatedMessage.chat) {
                const chatId = populatedMessage.chat._id ? populatedMessage.chat._id.toString() : populatedMessage.chat.toString();
                io.to(`chat-${chatId}`).emit("message-read", {
                    chatId: chatId,
                    messageId: populatedMessage._id.toString(),
                    userId: user._id.toString(),
                    readBy: populatedMessage.toJSON().readBy,
                });
            }
            return populatedMessage;
        },

        markAsDelivered: async (parent, { messageId }, { user, io }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const message = await Message.findById(messageId);
            if (!message) throw new GraphQLError("Message find failure", { extensions: { code: 'BAD_USER_INPUT' } });
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

        toggleFavorite: async (parent, { chatId }, { user }) => {
            if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
            const userDoc = await User.findById(user._id);
            if (!userDoc) throw new GraphQLError("User not found", { extensions: { code: 'BAD_USER_INPUT' } });
            const chatObjectId = new mongoose.Types.ObjectId(chatId);
            const index = userDoc.favorites.indexOf(chatObjectId);
            if (index === -1) {
                userDoc.favorites.push(chatObjectId);
            } else {
                userDoc.favorites.splice(index, 1);
            }
            await userDoc.save();
            return userDoc;
        },
    },

    Subscription: {
        messageAdded: {
            subscribe: withFilter(
                (parent, { chatId }, { pubsub, user }) => {
                    if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
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
                    if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
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
                    if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
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
                if (!user) throw new GraphQLError("Not authenticated", { extensions: { code: 'UNAUTHENTICATED' } });
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
            let lastMsg = chatDoc.lastMessage;
            if (!lastMsg || !lastMsg.sender || !lastMsg.readBy) {
                lastMsg = await Message.findById(lastMessageId)
                    .populate("readBy.user")
                    .populate("sender");
            }
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
        } catch (error) {
            console.error("Error getting message status:", error);
            return chat.messageStatus || "sent";
        }
    },
    unreadCount: async (chat, args, { user }) => {
        if (!user) return 0;
        if (chat._unreadCount !== undefined) return chat._unreadCount;
        try {
            const count = await Message.countDocuments({
                chat: chat._id,
                sender: { $ne: user._id },
                "readBy.user": { $ne: user._id },
            });
            return count || 0;
        } catch (error) {
            console.error("Error getting unread count:", error);
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