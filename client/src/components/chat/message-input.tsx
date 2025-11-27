import type React from "react"

import { Paperclip, Smile, Camera, Send } from "lucide-react"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
}

export function MessageInput({ value, onChange, onSend }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend(value)
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
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white placeholder-[#6b7280] focus:outline-none py-2"
        />

        <button className="text-[#6b7280] hover:text-white transition-colors">
          <Smile className="w-5 h-5" />
        </button>
        <button className="text-[#6b7280] hover:text-white transition-colors">
          <Camera className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 bg-[#3b82f6] rounded-full flex items-center justify-center hover:bg-[#2563eb] transition-colors">
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  )
}
