import { gql } from "@apollo/client";

export const LEAVE_CHAT = gql`
  mutation LeaveChat($chatId: ID!) {
    leaveChat(chatId: $chatId) {
      id
      participants {
        id
        username
      }
    }
  }
`;
