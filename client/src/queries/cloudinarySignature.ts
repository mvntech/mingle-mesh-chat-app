import { gql } from "@apollo/client";

export const CLOUDINARY_SIGNATURE_QUERY = gql`
  query CloudinarySignature {
    cloudinarySignature {
      signature
      timestamp
      cloudName
      apiKey
    }
  }
`;