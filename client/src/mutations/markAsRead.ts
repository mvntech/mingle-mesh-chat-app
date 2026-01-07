import { gql } from "@apollo/client";

export const MARK_AS_READ = gql`
  mutation MarkAsRead($messageId: ID!) {
    markAsRead(messageId: $messageId) {
      id
      readBy {
        user {
          id
        }
        readAt
      }
    }
  }
`;