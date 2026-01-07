import { Check, CheckCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ConversationItemProps } from "../../types/chat";

export function ConversationItem({ conversation, isSelected, onClick, isTyping }: ConversationItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left",
                isSelected ? "bg-[#3b82f6]/20" : "hover:bg-[#1f1f2e]"
            )}>

            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img
                        src={conversation.avatar || "/dummy-user.jpeg"}
                        alt={conversation.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#1a1a24]" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate">
                        {conversation.name}
                    </span>
                    <span className="text-[#6b7280] text-xs flex-shrink-0">
                        {conversation.time}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                    <span className={cn("text-sm truncate", isTyping ? "text-[#3b82f6]" : "text-[#6b7280]")}>
                        {isTyping ? "Typing..." : conversation.lastMessage}
                    </span>
                    <div className="flex items-center flex-shrink-0">
                        {(conversation.unreadCount ?? 0) > 0 ? (
                            <div className="w-5 h-5 bg-[#3b82f6] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                    {conversation.unreadCount}
                                </span>
                            </div>
                        ) : (
                            <>
                                {conversation.messageStatus === "read" && (
                                    <CheckCheck className="w-5 h-5 text-[#3b82f6]" />
                                )}
                                {conversation.messageStatus === "delivered" && (
                                    <CheckCheck className="w-5 h-5 text-[#6b7280]" />
                                )}
                                {conversation.messageStatus === "sent" && (
                                    <Check className="w-5 h-5 text-[#6b7280]" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}