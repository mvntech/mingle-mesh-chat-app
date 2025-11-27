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
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    id: ID!
    sender: User!
    message: String!
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

  type TypingIndicator {
    chatId: ID!
    user: User!
    isTyping: Boolean!
  }

  type Query {
    # user queries
    me: User
    getUser(id: ID!): User
    getUsers(search: String): [User!]!
  }

  type Mutation {
    # auth mutations
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
}
`;

export default typeDefs;
