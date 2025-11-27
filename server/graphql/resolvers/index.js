import mongoose from 'mongoose';
import User from '../../models/User.js';
import Chat from '../../models/Chat.js';
import Message from '../../models/Message.js';
import { generateToken } from '../../middleware/auth.js';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

const resolvers = {
  Query: {
    me: async (parent, args, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return user;
    },

    getUser: async (parent, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await User.findById(id);
    },

    getUsers: async (parent, { search }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const query = search
        ? {
            // searching parameters
            $or: [
              { username: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
            // exclude current user
            _id: { $ne: user._id },
          }
        : { _id: { $ne: user._id } };
      return await User.find(query).limit(20);
    },
  },

  Mutation: {
    register: async (parent, { username, email, password }) => {
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        throw new UserInputError('User already exists');
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
        throw new AuthenticationError('Invalid credentials');
      }

      user.isOnline = true;
      await user.save();

      const token = generateToken(user._id);

      return {
        token,
        user,
      };
    },
  },
};

export default resolvers;

