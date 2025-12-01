import { gql } from "@apollo/client";

export const GET_ME = gql`
  query Me {
    token
    me {
      id
      username
      email
      avatar
      isOnline
    }
  }
`;
