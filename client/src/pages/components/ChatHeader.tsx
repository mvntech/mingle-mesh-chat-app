import type { ChatHeaderProps } from "../../types/chat"

export function ChatHeader({ conversation }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f2e]">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img
                            src={conversation.avatar || "/dummy-user.jpeg"}
                            alt={conversation.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#0a0a0f]" />
                    )}
                </div>
                <div>
                    <h2 className="text-white font-semibold text-lg">{conversation.name}</h2>
                    <p className="text-[#22c55e] text-sm">{conversation.isOnline ? "Online" : "Offline"}</p>
                </div>
            </div>
        </div>
    )
}