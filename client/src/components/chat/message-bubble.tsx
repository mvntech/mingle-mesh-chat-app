import { cn } from "../../lib/utils"
import { type ChatMessage } from "../../types/message"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={cn("flex flex-col", message.isOwn ? "ml-auto items-end" : "mr-auto items-start")}>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl",
          message.isOwn ? "bg-[#3b82f6] text-white rounded-br-md" : "bg-[#1f1f2e] text-white rounded-bl-md",
        )}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
      </div>
      <span className="text-[#6b7280] text-xs mt-1">Today, {message.time}</span>
    </div>
  )
}
