import { gql } from "@apollo/client";

export const GET_MESSAGES = gql`
  query GetMessages($chatId: ID!) {
    getMessages(chatId: $chatId) {
      id
      content
      createdAt
      sender {
        id
      }
    }
  }
`;
