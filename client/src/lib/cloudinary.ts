import { ApolloClient } from "@apollo/client";
import { CLOUDINARY_SIGNATURE_QUERY } from "../queries/cloudinarySignature";
import type { CloudinarySignatureData, UploadResult } from "../types/media.ts";

export const uploadToCloudinary = async (file: File, client: ApolloClient, folder = "chat_uploads", onProgress?: (percent: number) => void): Promise<UploadResult> => {
    if (!file.type) throw new Error("File type is missing");
    const allowedTypes = ["image/", "video/", "audio/", "application/"];
    if (!allowedTypes.some((t) => file.type.startsWith(t))) {
        throw new Error("Unsupported file type");
    }
    try {
        const { data } = await client.query<CloudinarySignatureData>({
            query: CLOUDINARY_SIGNATURE_QUERY,
            fetchPolicy: "network-only",
        });
        if (!data) throw new Error("Failed to get Cloudinary signature");
        const { signature, timestamp, cloudName, apiKey } = data.cloudinarySignature;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);
        const resourceType = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
                ? "video"
                : "raw";
        return await new Promise<UploadResult>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent);
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result: UploadResult = JSON.parse(xhr.response);
                        resolve(result);
                    } catch (error) {
                        reject(new Error("Failed to parse Cloudinary response"));
                        reject(error);
                    }
                } else {
                    reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
                }
            };
            xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
            xhr.send(formData);
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
