import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { ConversationList } from "./components/ConversationList";
import { ChatView } from "./components/ChatView";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import { MessageCircle, Camera, Video, File } from "lucide-react";
import createSocket from "../lib/socket";
import type { GetMeData } from "../types/user";
import { type Conversation, type GetChatsData } from "../types/chat";
import { GET_ME } from "../queries/getMe";
import { GET_CHATS } from "../queries/getChats";
import { MARK_AS_DELIVERED } from "../mutations/markAsDelivered";
import { GET_MESSAGES } from "../queries/getMessages";

export function MingleMeshChat() {
    const [activeNav, setActiveNav] = useState<string>("home");
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
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
                lastMessage: chat.lastMessage?.content ? (
                    chat.lastMessage.content
                ) : chat.lastMessage?.fileType === "image" ? (
                    <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Photo
                    </span>
                ) : chat.lastMessage?.fileType === "video" ? (
                    <span className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Video
                    </span>
                ) : chat.lastMessage?.fileUrl ? (
                    <span className="flex items-center gap-1.5">
                        <File className="w-3.5 h-3.5" /> File
                    </span>
                ) : (
                    ""
                ),
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

    useEffect(() => {
        const socket = createSocket();
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
        };
    }, []);

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
                typingUsers={typingUsers}
            />

            {selectedConversation ? (
                <ChatView
                    conversation={selectedConversation}
                    currentUserId={currentUserId}
                    typingUsers={typingUsers[selectedConversation.id] || []}
                    onLeaveChat={() => setSelectedConversation(null)}
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
    const [markAsDelivered] = useMutation(MARK_AS_DELIVERED);
    const dataRef = useRef<GetChatsData | null>(null);
    useEffect(() => {
        dataRef.current = data ?? null;
    }, [data]);

    useEffect(() => {
        if (!currentUserId) return;
        const socket = createSocket();

        const joinRooms = () => {
            const chatIds = (dataRef.current?.getChats || []).map((c) => c.id);
            if (chatIds.length > 0) {
                socket.emit("join-chats", chatIds);
            }
        };

        socket.on("connect", () => {
            joinRooms();
        });

        socket.on("new-message", (payload: { chatId: string; message: any }) => {
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
                markAsDelivered({ variables: { messageId: message.id } }).catch(e => console.error("Mark delivered failed", e));
            }
            try {
                const chatIdent = client.cache.identify({ __typename: "Chat", id: chatId });
                if (chatIdent) {
                    client.cache.modify({
                        id: chatIdent,
                        fields: {
                            unreadCount(prev = 0) {
                                if (message.sender?.id !== currentUserId) {
                                    return prev + 1;
                                }
                                return prev;
                            },
                            lastMessage() {
                                return message;
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
                } catch (e) { }
            } catch (e) {
                console.error("Cache update error:", e);
            }
        });

        socket.on("new-chat", (rawChat: any) => {
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
            } catch (e) {
                console.error("Cache update error (new-chat):", e);
            }
        });

        socket.on("message-delivered", (payload: { chatId: string, messageId: string, status: string }) => {
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
            } catch (e) {
                console.error("Cache update error:", e);
            }
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
                } catch (e) {
                    console.error("Failed to update message readBy in cache:", e);
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
                                    messageStatus() {
                                        return "read";
                                    },
                                },
                            });
                        }
                    } catch (e) {
                        console.error("Failed to update chat messageStatus:", e);
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
                    } catch (e) {
                        console.error("Failed to update chat unreadCount in cache:", e);
                    }
                }
            } catch (e) {
                console.error("message-read handler error:", e);
            }
        });

        return () => {
            socket.off("message-read");
            socket.off("message-delivered");
            socket.off("new-message");
            socket.off("new-chat");
            socket.off("connect");
            try {
                if (socket.connected) socket.disconnect();
            } catch (e) {
                console.error(e);
            }
        };
    }, [client, currentUserId, markAsDelivered]);

    useEffect(() => {
        if (!data?.getChats || !currentUserId) return;
        const socket = createSocket();
        const chatIds = data.getChats.map((c) => c.id);
        if (chatIds.length > 0) {
            socket.emit("join-chats", chatIds);
        }
    }, [data, currentUserId]);

    return <MingleMeshChat />;
}