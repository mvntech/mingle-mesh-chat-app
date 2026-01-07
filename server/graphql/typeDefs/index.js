import { gql } from "apollo-server-express";

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    isOnline: Boolean!
    lastSeen: String
    createdAt: String!
    updatedAt: String!
  }

  type Chat {
      id: ID!
      name: String
      isGroupChat: Boolean!
      participants: [User!]!
      lastMessage: Message
      groupAdmin: User
      messageStatus: String
      unreadCount: Int!
      createdAt: String!
      updatedAt: String!
  }

  type Message {
      id: ID!
      sender: User!
      content: String
      fileUrl: String
      fileType: String
      fileName: String
      chat: Chat!
      readBy: [ReadBy!]!
      status: String
      createdAt: String!
      updatedAt: String!
  }

  type ReadBy {
      user: User!
      readAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type TypingIndicator {
      chatId: ID!
      user: User!
      isTyping: Boolean!
  }

  type CloudinarySignature {
      signature: String!
      timestamp: Int!
      cloudName: String!
      apiKey: String!
  }

  type Query {
      me: User
      getUser(id: ID!): User
      getUsers(search: String): [User!]!

      getChats: [Chat!]!
      getChat(id: ID!): Chat

      getMessages(chatId: ID!, limit: Int, offset: Int): [Message!]!
      
      cloudinarySignature: CloudinarySignature!
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
      
    updateProfile(username: String, avatar: String): User!
    updateOnlineStatus(isOnline: Boolean!): User!

    createChat(
        participantIds: [ID!]!
        name: String
        isGroupChat: Boolean
    ): Chat!
    leaveChat(chatId: ID!): Chat!

    sendMessage(
      chatId: ID!
      content: String
      fileUrl: String
      fileType: String
      fileName: String
    ): Message!
    markAsRead(messageId: ID!): Message!
    markAsDelivered(messageId: ID!): Message!
  }

  type Subscription {
      messageAdded(chatId: ID!): Message!
      typingStatus(chatId: ID!): TypingIndicator!
      userStatusChanged: User!
      chatUpdated: Chat!
  }
`;

export default typeDefs;