import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ConversationList } from "./components/ConversationList";
import { ChatView } from "./components/ChatView";
import {type Conversation, type GetChatsData} from "../types/chat";
import { useQuery, useApolloClient } from "@apollo/client/react";
import { GET_ME } from "../queries/getMe";
import { GET_CHATS } from "../queries/getChats";
import { MessageCircle } from "lucide-react";
import type { GetMeData } from "../types/user";
import createSocket from "../lib/socket";

export function MingleMeshChat() {
    const [activeNav, setActiveNav] = useState<string>("home");
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { data, loading: chatsLoading } = useQuery<GetChatsData>(GET_CHATS);
    const { data: userData } = useQuery<GetMeData>(GET_ME);
    const currentUserId: string | null = userData?.me?.id ?? localStorage.getItem("userId");
    const chats: Conversation[] = data
        ? data.getChats.map((chat) => {
            const other =
                chat.participants.find((p) => p.id !== currentUserId) ||
                chat.participants[0];
            return {
                id: chat.id,
                name: chat.name || other.username,
                avatar: other.avatar ?? null,
                isOnline: other.isOnline,
                lastMessage: chat.lastMessage?.content || "",
                time: chat.lastMessage
                    ? new Date(chat.lastMessage.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                    })
                    : "",
                isGroupChat: chat.isGroupChat,
                messageStatus: chat.messageStatus,
                unreadCount: chat.unreadCount ?? 0,
            };
        })
        : [];

    return (
        <div className="flex h-screen bg-[#0a0a0f] overflow-hidden font-sans">
            <Sidebar
                activeNav={activeNav}
                onNavChange={setActiveNav}
                user={userData?.me}
            />

            <ConversationList
                contacts={chats.filter((chat) => !chat.isGroupChat)}
                selectedId={selectedConversation?.id || ""}
                onSelect={setSelectedConversation}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                loading={chatsLoading}
            />

            {selectedConversation ? (
                <ChatView
                    conversation={selectedConversation}
                    currentUserId={currentUserId}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0f] text-[#6b7280]">
                    <div className="w-20 h-20 bg-[#1f1f2e] rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-10 h-10" />
                    </div>
                    <p>Select a conversation to start messaging</p>
                </div>
            )}
        </div>
    );
}

export function MingleMeshAppWrapper() {
    const client = useApolloClient();
    const { data: userData } = useQuery<GetMeData>(GET_ME);
    const currentUserId = userData?.me?.id ?? localStorage.getItem("userId");
    const { data } = useQuery<GetChatsData>(GET_CHATS);

    useEffect(() => {
        if (!currentUserId) return;
        const socket = createSocket();

        const joinRooms = () => {
            const chatIds = (data?.getChats || []).map((c) => c.id);
            if (chatIds.length > 0) {
                socket.emit("join-chats", chatIds);
            }
        };

        socket.on("connect", () => {
            joinRooms();
        });

        socket.on("message-read", (payload: {
            chatId?: string;
            messageId?: string;
            userId?: string;
            readBy?: Array<{
                user?: { id?: string; _id?: string };
                readAt?: string;
            }>;
        }) => {
            try {
                const { chatId, messageId, readBy, userId } = payload;
                try {
                    const messageIdent = client.cache.identify({
                        __typename: "Message",
                        id: messageId,
                    });
                    if (messageIdent) {
                        client.cache.modify({
                            id: messageIdent,
                            fields: {
                                readBy() {
                                    return (readBy || []).map((r) => ({
                                        __typename: "ReadBy",
                                        user: { __typename: "User", id: r.user?.id || r.user?._id },
                                        readAt: r.readAt,
                                    }));
                                },
                            },
                        });
                    }
                } catch (err) {
                    console.error("Failed to update message readBy in cache:", err);
                }

                if (String(userId) === String(currentUserId) && chatId) {
                    try {
                        const chatIdent = client.cache.identify({
                            __typename: "Chat",
                            id: chatId,
                        });
                        if (chatIdent) {
                            client.cache.modify({
                                id: chatIdent,
                                fields: {
                                    unreadCount(prev = 0) {
                                        return Math.max(0, prev - 1);
                                    },
                                },
                            });
                        }
                    } catch (err) {
                        console.error("Failed to update chat unreadCount in cache:", err);
                    }
                }
            } catch (err) {
                console.error("message-read handler error:", err);
            }
        });

        return () => {
            socket.off("message-read");
            socket.off("connect");
            try {
                socket.disconnect();
            } catch (e) {
                console.error(e);
            }
        };
    }, [client, currentUserId, data]);

    return <MingleMeshChat />;
}