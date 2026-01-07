import { ApolloClient } from "@apollo/client";
import type { UploadResult, CloudinarySignatureData } from "../types/media.ts";
import { CLOUDINARY_SIGNATURE_QUERY } from "../queries/cloudinarySignature.ts";

export const uploadToCloudinary = async (file: File, client: ApolloClient): Promise<UploadResult> => {
    try {
        const { data } = await client.query<CloudinarySignatureData>({
            query: CLOUDINARY_SIGNATURE_QUERY,
            fetchPolicy: "network-only",
        });
        if (!data) {
            throw new Error("Unable to retrieve Cloudinary signature");
        }

        const { signature, timestamp, cloudName, apiKey } = data.cloudinarySignature;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", "chat_uploads");

        const resourceType = file.type.startsWith("image/") ? "image" :
            file.type.startsWith("video/") ? "video" : "raw";

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Cloudinary upload failed");
        }
        return await response.json();
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
