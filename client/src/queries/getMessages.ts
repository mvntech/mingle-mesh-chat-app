import { gql } from "@apollo/client";
import { MESSAGE_FRAGMENT } from "../fragments/message";

export const GET_MESSAGES = gql`
  query GetMessages($chatId: ID!) {
    getMessages(chatId: $chatId) {
      ...MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;