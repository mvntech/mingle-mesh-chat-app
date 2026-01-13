export interface CloudinarySignatureData {
    cloudinarySignature: {
        signature: string;
        timestamp: number;
        cloudName: string;
        apiKey: string;
    };
}

export interface UploadResult {
    public_id: string;
    secure_url: string;
    resource_type: string;
    original_filename: string;
    format: string;
}