import { gql } from "@apollo/client";

export const MESSAGE_ADDED = gql`
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      content
      createdAt
      status
      sender {
        id
      }
    }
  }
`;