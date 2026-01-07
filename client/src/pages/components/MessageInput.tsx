import { useRef, useState } from "react"
import { Paperclip, Smile, Camera, Send, X, Loader2 } from "lucide-react"
import type { MessageInputProps } from "../../types/chat";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { useApolloClient } from "@apollo/client/react";
import toast from "react-hot-toast";

export function MessageInput({ value, onChange, onSend, disabled = false }: MessageInputProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ fileUrl: string, fileType: string, fileName: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const client = useApolloClient();

    const handleSend = () => {
        if (disabled || isUploading) return;

        if (value.trim() || selectedFile) {
            onSend(value, selectedFile || undefined);
            setSelectedFile(null);
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const result = await uploadToCloudinary(file, client);
            setSelectedFile({
                fileUrl: result.secure_url,
                fileType: result.resource_type,
                fileName: result.original_filename
            });
        } catch (e) {
            console.error("Upload failed", e);
            toast.error("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="p-4 border-t border-[#1f1f2e]">
            {selectedFile && (
                <div className="mb-2 p-2 bg-[#1f1f2e] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-4 h-4 text-[#3b82f6]" />
                        <span className="text-sm text-white truncate">{selectedFile.fileName}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="text-[#6b7280] hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-3 bg-[#1f1f2e] rounded-xl px-4 py-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    onClick={handleFileClick}
                    disabled={disabled || isUploading}
                    className="text-[#6b7280] hover:text-white transition-colors disabled:opacity-50"
                >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>

                <input
                    type="text"
                    placeholder={disabled ? "Loading messages..." : isUploading ? "Uploading file..." : "Type a message..."}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || isUploading}
                    className="flex-1 bg-transparent text-white placeholder-[#6b7280] focus:outline-none py-2 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="flex items-center gap-2">
                    <button className="text-[#6b7280] hover:text-white transition-colors" disabled={disabled || isUploading}>
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleFileClick}
                        className="text-[#6b7280] hover:text-white transition-colors"
                        disabled={disabled || isUploading}
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={disabled || isUploading || (!value.trim() && !selectedFile)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${!disabled && !isUploading && (value.trim() || selectedFile)
                            ? "bg-[#3b82f6] hover:bg-[#2563eb]"
                            : "bg-[#2a2a35] cursor-not-allowed"
                            }`}
                    >
                        <Send className={`w-5 h-5 ${!disabled && !isUploading && (value.trim() || selectedFile) ? "text-white" : "text-[#6b7280]"}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}