import { gql } from "@apollo/client";

export const MESSAGE_FRAGMENT = gql`
  fragment MessageFragment on Message {
    id
    content
    fileUrl
    fileType
    fileName
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
`;
