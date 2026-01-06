import { useState } from "react"
import { ChatHeader } from "./ChatHeader"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"
import type { ChatViewProps } from "../../types/chat.ts";

export function ChatView({ conversation }: ChatViewProps) {
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState("")
    const handleSendMessage = () => {}

    return (
        <div className="flex-1 flex flex-col bg-[#0a0a0f] my-3 mr-3 rounded-2xl overflow-hidden">
            <ChatHeader conversation={conversation} />

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                    <MessageBubble key={message} message={message} />
                ))}
            </div>

            <MessageInput value={inputValue} onChange={setInputValue} onSend={handleSendMessage} />
        </div>
    )
}