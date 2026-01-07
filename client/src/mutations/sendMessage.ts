import { gql } from "@apollo/client";

export const SEND_MESSAGE = gql`
  mutation SendMessage($chatId: ID!, $content: String!) {
    sendMessage(chatId: $chatId, content: $content) {
      id
      content
      createdAt
      status
      sender {
        id
      }
      readBy {
        user {
          id
        }
      }
    }
  }
`;