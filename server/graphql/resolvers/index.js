import mongoose from "mongoose";
import User from "../../models/User.js";
import Chat from "../../models/Chat.js";
import Message from "../../models/Message.js";
import { generateToken } from "../../middleware/auth.js";
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
            // searching parameters
            $or: [
              { username: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
            // exclude current user
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

    getMessages: async (
      parent,
      { chatId, limit = 50, offset = 0 },
      { user }
    ) => {
      if (!user) throw new AuthenticationError("Not authenticated");

      const chat = await Chat.findOne({
        _id: chatId,
        participants: { $in: [user._id] },
      });
      if (!chat) throw new UserInputError("Chat not found");

      return await Message.find({ chat: chatId })
        .populate("sender")
        .populate("chat")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
    },
  },

  Mutation: {
    register: async (parent, { username, email, password }) => {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        throw new UserInputError("User already exists");
      }

      const user = await User.create({ username, email, password });
      const token = generateToken(user._id);

      return {
        token,
        user,
      };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user || !(await user.matchPassword(password))) {
        throw new AuthenticationError("Invalid credentials");
      }

      user.isOnline = true;
      await user.save();

      const token = generateToken(user._id);

      return {
        token,
        user,
      };
    },

    createChat: async (
      parent,
      { participantIds, name, isGroupChat = false },
      { user }
    ) => {
      if (!user) throw new AuthenticationError("Not authenticated");

      if (!isGroupChat && participantIds.length !== 1) {
        throw new UserInputError(
          "Direct chat must have exactly one participant"
        );
      }

      // convert all IDs to objectIds for consistent comparison
      const participantObjectIds = participantIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const userObjectId = user._id;

      const allParticipants = [...participantObjectIds, userObjectId];
      const uniqueParticipants = [
        ...new Set(allParticipants.map((id) => id.toString())),
      ].map((id) => new mongoose.Types.ObjectId(id));

      // check if direct chat already exists
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

      return await Chat.findById(chat._id)
        .populate("participants")
        .populate("lastMessage")
        .populate("groupAdmin");
    },

    addUserToChat: async (parent, { chatId, userId }, { user }) => {
      if (!user) throw new AuthenticationError("Not authenticated");

      const chat = await Chat.findById(chatId);
      if (!chat) throw new UserInputError("Chat not found");
      if (!chat.isGroupChat)
        throw new UserInputError("Cannot add users to direct chat");
      if (chat.groupAdmin?.toString() !== user._id.toString()) {
        throw new AuthenticationError("Only group admin can add users");
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new UserInputError("Invalid userId");
      }

      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
        await chat.save();
      }

      return await Chat.findById(chatId)
        .populate("participants")
        .populate("lastMessage")
        .populate("groupAdmin");
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

    sendMessage: async (parent, { chatId, content }, { user, pubsub, io }) => {
      if (!user) throw new AuthenticationError("Not authenticated");

      const chat = await Chat.findOne({
        _id: chatId,
        participants: { $in: [user._id] },
      });

      if (!chat) throw new UserInputError("Chat not found");

      const safeMessage = DOMPurify.sanitize(message);
      const message = await Message.create({
        sender: user._id,
        content: safeMessage,
        chat: chatId,
        readBy: [{ user: user._id, readAt: new Date() }],
      });

      chat.lastMessage = message._id;
      await chat.save();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender")
        .populate("chat")
        .populate("readBy.user");

      // publish to subscription
      if (pubsub) {
        pubsub.publish(`MESSAGE_ADDED_${chatId}`, {
          messageAdded: populatedMessage,
          chatId: chatId,
        });
      }

      // emit socket.io event for real-time updates
      if (io) {
        io.to(`chat-${chatId}`).emit("new-message", {
          chatId,
          message: populatedMessage,
        });
      }

      return populatedMessage;
    },

    markAsRead: async (parent, { messageId }, { user }) => {
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

      return await Message.findById(messageId)
        .populate("sender")
        .populate("chat")
        .populate("readBy.user");
    },

    updateProfile: async (parent, { username, avatar }, { user }) => {
      if (!user) throw new AuthenticationError("Not authenticated");

      if (username) {
        const existingUser = await User.findOne({
          username,
          _id: { $ne: user._id },
        });
        if (existingUser) throw new UserInputError("Username already taken");
        user.username = username;
      }

      if (avatar !== undefined) {
        user.avatar = avatar;
      }

      await user.save();
      return user;
    },

    updateOnlineStatus: async (parent, { isOnline }, { user, pubsub }) => {
      if (!user) throw new AuthenticationError("Not authenticated");

      user.isOnline = isOnline;
      user.lastSeen = new Date();
      await user.save();

      // publish to subscription
      if (pubsub) {
        pubsub.publish("USER_STATUS_CHANGED", {
          userStatusChanged: user,
        });
      }

      return user;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: withFilter(async (parent, { chatId }, { pubsub, user }) => {
        if (!user) throw new AuthenticationError("Not authenticated");
        const chat = await Chat.findOne({
          _id: chatId,
          participants: { $in: [user._id] },
        });
        if (!chat) throw new AuthenticationError("Unauthorized chat access");

        return pubsub.asyncIterator(`MESSAGE_ADDED_${chatId}`);
      }),
    },

    typingStatus: {
      subscribe: async (parent, { chatId }, { pubsub, user }) => {
        if (!user) throw new AuthenticationError("Not authenticated");

        const chat = await Chat.findOne({
          _id: chatId,
          participants: { $in: [user._id] },
        });
        if (!chat) throw new AuthenticationError("Unauthorized chat access");

        return pubsub.asyncIterator(`TYPING_${chatId}`);
      },
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

export default resolvers;
