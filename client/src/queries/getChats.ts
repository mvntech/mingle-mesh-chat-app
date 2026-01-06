import { gql } from "@apollo/client";

export const GET_CHATS = gql`
  query GetChats {
    getChats {
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
        content
        createdAt
      }
      messageStatus
      unreadCount
    }
  }
`;