import { gql } from "@apollo/client";

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($username: String, $avatar: String) {
    updateProfile(username: $username, avatar: $avatar) {
      id
      username
      avatar
      email
      updatedAt
    }
  }
`;
