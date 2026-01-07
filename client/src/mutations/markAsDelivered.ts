import { gql } from "@apollo/client";

export const MARK_AS_DELIVERED = gql`
    mutation MarkAsDelivered($messageId: ID!) {
        markAsDelivered(messageId: $messageId) {
            id
            status
            readBy {
                user {
                    id
                }
                readAt
            }
        }
    }
`;
