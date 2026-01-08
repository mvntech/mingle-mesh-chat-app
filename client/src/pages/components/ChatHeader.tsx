import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-hot-toast";
import { ConfirmationModal } from "./ConfirmationModal";
import { Star, Trash2 } from "lucide-react";
import type { ChatHeaderProps } from "../../types/chat";
import { GET_CHATS } from "../../queries/getChats";
import { LEAVE_CHAT } from "../../mutations/leaveChat";

export function ChatHeader({ conversation, onLeaveChat }: ChatHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [leaveChat, { loading }] = useMutation(LEAVE_CHAT, {
        variables: { chatId: conversation.id },
        update: (cache: any) => {
            const existingChats: any = cache.readQuery({ query: GET_CHATS });
            if (existingChats) {
                cache.writeQuery({
                    query: GET_CHATS,
                    data: {
                        getChats: existingChats.getChats.filter(
                            (c: any) => c.id !== conversation.id
                        ),
                    },
                });
            }
        },
        onCompleted: () => {
            toast.success("Left the chat successfully");
            onLeaveChat?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to leave chat");
        }
    });

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
            <div className="flex items-center gap-2">
                <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[#3b82f6] hover:bg-[#1f1f2e] transition-colors duration-150"
                    title="Star">
                    <Star className="w-5 h-5" />
                </button>
                <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#1f1f2e] transition-all duration-150"
                    onClick={() => setIsModalOpen(true)}
                    title="Leave Chat">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={async () => {
                    await leaveChat();
                    setIsModalOpen(false);
                }}
                title="Leave Chat"
                message="Are you sure you want to leave this chat? You will no longer be able to see future messages, but the message history will remain for other participants."
                confirmText="Leave Chat"
                isLoading={loading}
            />
        </div>
    )
}