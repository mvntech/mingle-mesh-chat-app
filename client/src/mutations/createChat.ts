import { gql } from "@apollo/client";

export const CREATE_CHAT = gql`
  mutation CreateChat($participantIds: [ID!]!, $name: String, $isGroupChat: Boolean) {
    createChat(participantIds: $participantIds, name: $name, isGroupChat: $isGroupChat) {
      id
      name
      isGroupChat
      participants {
        id
        username
        avatar
        isOnline
      }
      lastMessage {
        id
        content
        createdAt
      }
    }
  }
`;