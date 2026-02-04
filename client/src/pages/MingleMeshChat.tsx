import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import toast from "react-hot-toast";
import { MessageSquareText } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { cn } from "../lib/utils";
import { Sidebar } from "./components/Sidebar";
import { ConversationList } from "./components/ConversationList";
import { ProfilePage } from "./ProfilePage";
import { ChatView } from "./components/ChatView";
import { GET_ME } from "../queries/getMe";
import { GET_CHATS } from "../queries/getChats";
import { GET_MESSAGES } from "../queries/getMessages";
import { MARK_AS_DELIVERED } from "../mutations/markAsDelivered";
import type { GetMeData } from "../types/user";
import type { Conversation, GetChatsData } from "../types/chat";
import type { MingleMeshChatProps } from "../types/chat";

export function MingleMeshChat({
    activeNav,
    setActiveNav,
    selectedConversation,
    setSelectedConversation,
    searchQuery,
    setSearchQuery,
    typingUsers
}: MingleMeshChatProps) {
    const { data, loading: chatsLoading } = useQuery<GetChatsData>(GET_CHATS);
    const { data: userData } = useQuery<GetMeData>(GET_ME);
    const { socket } = useSocket();
    const currentUserId: string | null = userData?.me?.id ?? localStorage.getItem("userId");
    const chats: Conversation[] = useMemo(() => {
        if (!data) return [];
        return data.getChats.map((chat) => {
            const other =
                chat.participants.find((p) => p.id !== currentUserId) ||
                chat.participants[0];

            let messageType: 'text' | 'image' | 'video' | 'file' | 'empty' = 'empty';
            let messageContent = '';

            if (chat.lastMessage?.content) {
                messageType = 'text';
                messageContent = chat.lastMessage.content;
            } else if (chat.lastMessage?.fileType === "image") {
                messageType = 'image';
                messageContent = 'Photo';
            } else if (chat.lastMessage?.fileType === "video") {
                messageType = 'video';
                messageContent = 'Video';
            } else if (chat.lastMessage?.fileUrl) {
                messageType = 'file';
                messageContent = 'File';
            }

            return {
                id: chat.id,
                name: chat.name || other.username,
                avatar: other.avatar ?? null,
                isOnline: other.isOnline,
                lastMessage: messageContent,
                messageType: messageType,
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
        });
    }, [data, currentUserId]);
    const filteredChats = useMemo(() => {
        if (!userData?.me) return chats;
        switch (activeNav) {
            case "favorites":
                return chats.filter(chat => userData.me.favorites?.includes(chat.id));
            case "chat":
                return chats.filter(chat => !userData.me.favorites?.includes(chat.id));
            default:
                return chats;
        }
    }, [activeNav, chats, userData]);
    const totalUnreadCount = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
    useEffect(() => {
        if (!socket) return;
        const onConnect = () => toast.dismiss("connection");
        const onDisconnect = () => toast.error("You're offline", { id: "connection" });
        const onConnectError = () => toast.error("Connection error. Reconnecting...", { id: "connection" });
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
        };
    }, [socket]);

    return (
        <div className="flex flex-col md:flex-row h-dvh bg-[#0a0a0f] overflow-hidden font-sans relative">
            <div className={cn(
                selectedConversation && "hidden md:block"
            )}>
                <Sidebar
                    activeNav={activeNav}
                    onNavChange={setActiveNav}
                    user={userData?.me}
                    unreadTotal={totalUnreadCount}
                />
            </div>

            <div className={cn(
                "flex-1 md:flex-none md:w-[340px] flex flex-col pb-20 md:pb-0",
                selectedConversation ? "hidden md:flex" : "flex",
                activeNav === "settings" && "hidden md:hidden"
            )}>
                <ConversationList
                    contacts={filteredChats.filter((chat) => !chat.isGroupChat)}
                    favorites={userData?.me?.favorites}
                    selectedId={selectedConversation?.id || ""}
                    onSelect={setSelectedConversation}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    loading={chatsLoading}
                    typingUsers={typingUsers}
                />
            </div>

            <div className={cn(
                "flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 md:pb-0",
                !selectedConversation && activeNav !== "settings" ? "hidden md:flex pb-20" : "flex pb-0"
            )}>
                {activeNav === "settings" ? (
                    <ProfilePage user={userData?.me} />
                ) : selectedConversation ? (
                    <ChatView
                        conversation={selectedConversation}
                        currentUserId={currentUserId}
                        typingUsers={typingUsers[selectedConversation.id] || []}
                        onLeaveChat={() => setSelectedConversation(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0f] text-[#6b7280]">
                        <div className="w-20 h-20 bg-[#1f1f2e] rounded-full flex items-center justify-center mb-3 ring-1 ring-[#2a2a35]">
                            <MessageSquareText className="w-10 h-10" />
                        </div>
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MingleMeshAppWrapper() {
    const client = useApolloClient();
    const [activeNav, setActiveNav] = useState<string>("home");
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
    const selectedChatIdRef = useRef<string | null>(null);
    useEffect(() => {
        selectedChatIdRef.current = selectedConversation?.id || null;
    }, [selectedConversation]);
    const { data: userData } = useQuery<GetMeData>(GET_ME);
    const currentUserId = userData?.me?.id ?? localStorage.getItem("userId");
    const { data } = useQuery<GetChatsData>(GET_CHATS);
    const { socket } = useSocket();
    const [markAsDelivered] = useMutation(MARK_AS_DELIVERED);
    const dataRef = useRef<GetChatsData | null>(null);
    useEffect(() => {
        dataRef.current = data ?? null;
    }, [data]);
    useEffect(() => {
        if (!socket) return;
        const handleTyping = ({ chatId, user, isTyping }: { chatId: string, user: { username: string }, isTyping: boolean }) => {
            setTypingUsers(prev => {
                const currentTypers = prev[chatId] || [];
                if (isTyping) {
                    if (!currentTypers.includes(user.username)) {
                        return { ...prev, [chatId]: [...currentTypers, user.username] };
                    }
                } else {
                    return { ...prev, [chatId]: currentTypers.filter(u => u !== user.username) };
                }
                return prev;
            });
        };
        socket.on("typing", handleTyping);
        return () => {
            socket.off("typing", handleTyping);
            setTypingUsers({});
        };
    }, [socket]);
    useEffect(() => {
        if (!currentUserId || !socket) return;
        const onNewMessage = (payload: { chatId: string; message: any }) => {
            const { chatId, message: rawMessage } = payload;
            const normalizeUser = (u: any) => u ? ({
                ...u,
                id: String(u.id || u._id || ''),
                __typename: "User"
            }) : null;
            const message = {
                ...rawMessage,
                __typename: "Message",
                id: String(rawMessage.id || rawMessage._id || ''),
                content: rawMessage.content || null,
                fileUrl: rawMessage.fileUrl || null,
                fileType: rawMessage.fileType || null,
                fileName: rawMessage.fileName || null,
                sender: normalizeUser(rawMessage.sender),
                readBy: (rawMessage.readBy || []).map((r: any) => ({
                    ...r,
                    __typename: "ReadBy",
                    user: normalizeUser(r.user)
                }))
            };
            if (message.sender?.id !== currentUserId) {
                markAsDelivered({ variables: { messageId: message.id } }).catch(error => console.error("Mark delivered failed", error));
            }
            try {
                const chatIdent = client.cache.identify({ __typename: "Chat", id: chatId });
                if (chatIdent) {
                    client.cache.modify({
                        id: chatIdent,
                        fields: {
                            unreadCount(prev = 0) {
                                if (message.sender?.id !== currentUserId && chatId !== selectedChatIdRef.current) {
                                    return prev + 1;
                                }
                                return prev;
                            },
                            lastMessage() {
                                return message;
                            },
                            messageStatus() {
                                return message.sender?.id === currentUserId ? "sent" : "delivered";
                            }
                        }
                    })
                }
                try {
                    const existingData: any = client.cache.readQuery({
                        query: GET_MESSAGES,
                        variables: { chatId },
                    });
                    if (existingData?.getMessages) {
                        const exists = existingData.getMessages.some((msg: any) => (msg.id || msg._id) === message.id);
                        if (!exists) {
                            client.cache.writeQuery({
                                query: GET_MESSAGES,
                                variables: { chatId },
                                data: {
                                    getMessages: [message, ...existingData.getMessages],
                                },
                            });
                        }
                    }
                } catch (error) {
                    console.error("Cache update error:", error);
                }
            } catch (error) {
                console.error("Cache update error:", error);
            }
        };
        const onNewChat = (rawChat: any) => {
            try {
                const normalizeUser = (u: any) => u ? ({
                    ...u,
                    id: String(u.id || u._id || ''),
                    __typename: "User"
                }) : null;
                const newChat = {
                    ...rawChat,
                    __typename: "Chat",
                    id: String(rawChat.id || rawChat._id || ''),
                    participants: (rawChat.participants || []).map(normalizeUser),
                    lastMessage: rawChat.lastMessage ? {
                        ...rawChat.lastMessage,
                        __typename: "Message",
                        id: String(rawChat.lastMessage.id || rawChat.lastMessage._id || ''),
                        content: rawChat.lastMessage.content || null,
                        sender: normalizeUser(rawChat.lastMessage.sender)
                    } : null
                };
                const exists = (dataRef.current?.getChats || []).some((c) => c.id === newChat.id);
                if (exists) return;
                client.cache.modify({
                    fields: {
                        getChats(existingChats = []) {
                            const newChatRef = client.cache.writeFragment({
                                data: newChat,
                                fragment: {
                                    kind: 'Document',
                                    definitions: [{
                                        kind: 'FragmentDefinition',
                                        name: 'NewChat',
                                        typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Chat' } },
                                        selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'isGroupChat' } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'unreadCount' } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'messageStatus' } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'participants' }, selectionSet: { kind: 'SelectionSet', selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }, { kind: 'Field', name: { kind: 'Name', value: 'username' } }, { kind: 'Field', name: { kind: 'Name', value: 'avatar' } }, { kind: 'Field', name: { kind: 'Name', value: 'isOnline' } }] } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'lastMessage' }, selectionSet: { kind: 'SelectionSet', selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }, { kind: 'Field', name: { kind: 'Name', value: 'content' } }, { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } }, { kind: 'Field', name: { kind: 'Name', value: 'sender' }, selectionSet: { kind: 'SelectionSet', selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }] } }] } },
                                                { kind: 'Field', name: { kind: 'Name', value: 'groupAdmin' }, selectionSet: { kind: 'SelectionSet', selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }] } }
                                            ]
                                        }
                                    }]
                                } as any
                            });
                            return [newChatRef, ...existingChats];
                        }
                    }
                });
                socket.emit("join-chats", [newChat.id]);
            } catch (error) {
                console.error("Cache update error (new-chat):", error);
            }
        };
        const onMessageDelivered = (payload: { chatId: string, messageId: string, status: string }) => {
            try {
                const { chatId, messageId, status } = payload;
                const messageIdent = client.cache.identify({ __typename: "Message", id: messageId });
                if (messageIdent) {
                    client.cache.modify({
                        id: messageIdent,
                        fields: {
                            status() { return status; }
                        }
                    });
                }
                if (chatId) {
                    const chatIdent = client.cache.identify({ __typename: "Chat", id: chatId });
                    if (chatIdent) {
                        client.cache.modify({
                            id: chatIdent,
                            fields: {
                                messageStatus() { return "delivered"; }
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Cache update error:", error);
            }
        };
        const onMessageRead = (payload: {
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
                } catch (error) {
                    console.error("Failed to update message readBy in cache:", error);
                }
                if (chatId) {
                    try {
                        const chatIdent = client.cache.identify({
                            __typename: "Chat",
                            id: chatId,
                        });
                        if (chatIdent) {
                            client.cache.modify({
                                id: chatIdent,
                                fields: {
                                    messageStatus() { return "read"; },
                                },
                            });
                        }
                    } catch (error) {
                        console.error("Failed to update chat messageStatus:", error);
                    }
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
                    } catch (error) {
                        console.error("Failed to update chat unreadCount in cache:", error);
                    }
                }
            } catch (error) {
                console.error("message-read handler error:", error);
            }
        };
        socket.on("new-message", onNewMessage);
        socket.on("new-chat", onNewChat);
        socket.on("message-delivered", onMessageDelivered);
        socket.on("message-read", onMessageRead);
        return () => {
            socket.off("new-message", onNewMessage);
            socket.off("new-chat", onNewChat);
            socket.off("message-delivered", onMessageDelivered);
            socket.off("message-read", onMessageRead);
        };
    }, [client, currentUserId, markAsDelivered, socket]);

    useEffect(() => {
        if (!data?.getChats || !currentUserId || !socket) return;
        const join = () => {
            const chatIds = data.getChats.map((c) => c.id);
            if (chatIds.length > 0) {
                socket.emit("join-chats", chatIds);
            }
        };
        if (socket.connected) {
            join();
        }
        socket.on("connect", join);
        return () => {
            socket.off("connect", join);
        };
    }, [data, currentUserId, socket]);

    return (
        <MingleMeshChat
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typingUsers={typingUsers}
        />
    );
}