import { useState } from "react"
import { ChatHeader } from "./chat-header"
import { MessageBubble } from "./message-bubble"
import { MessageInput } from "./message-input"
import type { Conversation, Message } from "../../lib/chat-data"
import { messagesData } from "../../lib/chat-data"

interface ChatViewProps {
  conversation: Conversation
}

export function ChatView({ conversation }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(messagesData[conversation.id] || [])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      isOwn: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0f] my-3 mr-3 rounded-2xl overflow-hidden">
      <ChatHeader conversation={conversation} />

      {/* messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {/* message input */}
      <MessageInput value={inputValue} onChange={setInputValue} onSend={handleSendMessage} />
    </div>
  )
}
