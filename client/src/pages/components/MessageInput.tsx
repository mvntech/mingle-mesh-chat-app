import type React from "react"
import { Paperclip, Smile, Camera, Send } from "lucide-react"
import type { MessageInputProps } from "../../types/chat";

export function MessageInput({ value, onChange, onSend, disabled = false }: MessageInputProps) {
    const handleSend = () => {
        if (!disabled && value.trim()) {
            onSend(value);
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
            <div className="flex items-center gap-3 bg-[#1f1f2e] rounded-xl px-4 py-2">
                <button className="text-[#6b7280] hover:text-white transition-colors">
                    <Paperclip className="w-5 h-5" />
                </button>

                <input
                    type="text"
                    placeholder={disabled ? "Loading messages..." : "Type a message..."}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className="flex-1 bg-transparent text-white placeholder-[#6b7280] focus:outline-none py-2 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="flex items-center gap-2">
                    <button className="text-[#6b7280] hover:text-white transition-colors" disabled={disabled}>
                        <Smile className="w-5 h-5" />
                    </button>
                    <button className="text-[#6b7280] hover:text-white transition-colors" disabled={disabled}>
                        <Camera className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={disabled || !value.trim()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            !disabled && value.trim() ? "bg-[#3b82f6] hover:bg-[#2563eb]" : "bg-[#2a2a35] cursor-not-allowed"
                        }`}
                    >
                        <Send className={`w-5 h-5 ${!disabled && value.trim() ? "text-white" : "text-[#6b7280]"}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}