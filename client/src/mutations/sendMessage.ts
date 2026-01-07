import { gql } from "@apollo/client";

export const SEND_MESSAGE = gql`
  mutation SendMessage($chatId: ID!, $content: String, $fileUrl: String, $fileType: String, $fileName: String) {
    sendMessage(chatId: $chatId, content: $content, fileUrl: $fileUrl, fileType: $fileType, fileName: $fileName) {
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
  }
`;