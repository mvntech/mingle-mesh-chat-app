import { gql } from "@apollo/client";

export const SEARCH_USERS = gql`
  query GetUsers($search: String) {
    getUsers(search: $search) {
      id
      username
      email
      avatar
      isOnline
    }
  }
`;