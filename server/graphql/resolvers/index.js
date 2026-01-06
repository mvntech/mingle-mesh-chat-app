import User from "../../models/User.js";
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
    },
};

export default resolvers;