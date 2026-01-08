import { gql } from "@apollo/client";

export const TOGGLE_FAVORITE = gql`
  mutation ToggleFavorite($chatId: ID!) {
    toggleFavorite(chatId: $chatId) {
      id
      favorites
    }
  }
`;
