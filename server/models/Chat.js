import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;

