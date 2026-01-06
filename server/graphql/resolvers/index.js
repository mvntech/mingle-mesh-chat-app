import mongoose from "mongoose";
import User from "../../models/User.js";
import Chat from "../../models/Chat.js";
import { generateToken } from "../../middleware/auth.js";
import { AuthenticationError, UserInputError } from "apollo-server-express";
import bcrypt from "bcryptjs";

const resolvers = {

    Query: {
        me: async (parent, args, {user}) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            return user;
        },

        getUser: async (parent, {id}, {user}) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            return await User.findById(id);
        },

        getUsers: async (parent, {search}, {user}) => {
            if (!user) throw new AuthenticationError("Not authenticated");
            if (search && search.length < 2) {
                throw new UserInputError("Search term too short");
            }
            const query = search
                ? {
                    $or: [
                        {username: {$regex: search, $options: "i"}},
                        {email: {$regex: search, $options: "i"}},
                    ],
                    _id: {$ne: user._id},
                }
                : {_id: {$ne: user._id}};
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

                const hashedPassword = await bcrypt.hash(password, 10);
                const user = await User.create({ username, email, password: hashedPassword });
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

        createChat: async (parent, { participantIds, name, isGroupChat = false }, { user }) => {
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

            return await Chat.findById(chat._id)
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
    },
};

export default resolvers;