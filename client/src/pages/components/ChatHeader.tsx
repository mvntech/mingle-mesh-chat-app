import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-hot-toast";
import { Star, Trash2, ChevronLeft } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { ConfirmationModal } from "./ConfirmationModal";
import type { GetMeData } from "../../types/user";
import type { ChatHeaderProps } from "../../types/chat";
import { LEAVE_CHAT } from "../../mutations/leaveChat";
import { TOGGLE_FAVORITE } from "../../mutations/toggleFavorite";
import { GET_CHATS } from "../../queries/getChats";
import { GET_ME } from "../../queries/getMe";
import { cn } from "../../lib/utils.ts";

export function ChatHeader({ conversation, onLeaveChat }: ChatHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { socket } = useSocket();
    const { data: userData } = useQuery<GetMeData>(GET_ME);
    const isFavorite = userData?.me?.favorites?.includes(conversation.id);
    const [toggleFavorite, { loading: toggleLoading }] = useMutation(TOGGLE_FAVORITE, {
        variables: { chatId: conversation.id },
        optimisticResponse: userData?.me ? {
            toggleFavorite: {
                __typename: "User",
                id: userData.me.id,
                favorites: isFavorite
                    ? userData.me.favorites.filter((id: string) => id !== conversation.id)
                    : [...userData.me.favorites, conversation.id]
            }
        } : undefined,
        onCompleted: () => {
            toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update favorites");
        }
    });
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
            if (socket) {
                socket.emit("leave-chat", conversation.id);
            }
            toast.success("Left the chat successfully");
            onLeaveChat?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to leave chat");
        }
    });

    return (
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-[#1f1f2e] bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                <button
                    onClick={() => onLeaveChat?.()}
                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img
                            src={conversation.avatar || "https://res.cloudinary.com/dgm2hjnfx/image/upload/v1767889266/dummy-user_ilqiiw.jpg"}
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
                    <p className={cn("text-sm", conversation.isOnline ? "text-[#22c55e]" : "text-gray-400")}>{conversation.isOnline ? "Online" : "Offline"}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-150 ${isFavorite ? "text-[#3b82f6] bg-[#1f1f2e]" : "text-[#3b82f6] hover:bg-[#1f1f2e]"
                        }`}
                    onClick={() => toggleFavorite()}
                    disabled={toggleLoading}
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
                    <Star className={`w-5 h-5 ${isFavorite ? "fill-[#3b82f6] stroke-[#3b82f6]" : ""}`} />
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