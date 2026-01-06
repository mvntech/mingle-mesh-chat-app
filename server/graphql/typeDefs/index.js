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
      content: String!
      chat: Chat!
      readBy: [ReadBy!]!
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

  type Query {
      me: User
      getUser(id: ID!): User
      getUsers(search: String): [User!]!

      getChats: [Chat!]!
      getChat(id: ID!): Chat
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
  }
`;

export default typeDefs;