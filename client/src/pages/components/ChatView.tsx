import { useState, useEffect, useRef, useMemo } from "react"
import { ChatHeader } from "./ChatHeader"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"
import { useSocket } from "../../context/SocketContext";
import { useQuery, useMutation } from "@apollo/client/react";
import { useApolloClient } from "@apollo/client/react";
import type { ChatViewProps } from "../../types/chat.ts";
import { GET_MESSAGES } from "../../queries/getMessages";
import { SEND_MESSAGE } from "../../mutations/sendMessage";
import { MARK_AS_READ } from "../../mutations/markAsRead";
import type { Message, GetMessagesData, SendMessageData, SendMessageVars } from "../../types/message";
import { MESSAGE_FRAGMENT } from "../../fragments/message";

export function ChatView({ conversation, currentUserId, typingUsers, onLeaveChat }: ChatViewProps) {
    const { socket } = useSocket();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState("");
    const typingTimeoutRef = useRef<any>(null);
    const handleInputChange = (value: string) => {
        setInputValue(value);
        if (socket) {
            socket.emit("typing", { chatId: conversation.id, isTyping: true });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (socket) socket.emit("typing", { chatId: conversation.id, isTyping: false });
        }, 2000);
    };
    const { data, loading, error } = useQuery<GetMessagesData>(GET_MESSAGES, {
        variables: { chatId: conversation.id },
        fetchPolicy: "cache-first",
    });
    const [sendMessage] = useMutation<SendMessageData, SendMessageVars>(SEND_MESSAGE);
    const [markAsRead] = useMutation(MARK_AS_READ);
    const client = useApolloClient();
    const markedRef = useRef<Record<string, boolean>>({});
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [data?.getMessages]);
    const messages = useMemo(() => {
        return [...(data?.getMessages || [])]
            .slice()
            .reverse();
    }, [data?.getMessages]);
    const handleSendMessage = async (text: string, fileData?: { fileUrl: string, fileType: string, fileName: string }) => {
        if (!text.trim() && !fileData) return;
        if (!conversation.id) return;
        try {
            await sendMessage({
                variables: {
                    chatId: conversation.id,
                    content: text.trim() || undefined,
                    ...fileData
                },
                optimisticResponse: {
                    sendMessage: {
                        __typename: "Message",
                        id: `temp-${Date.now()}`,
                        content: text.trim() || null,
                        fileUrl: fileData?.fileUrl || null,
                        fileType: fileData?.fileType || null,
                        fileName: fileData?.fileName || null,
                        createdAt: new Date().toISOString(),
                        status: "sent",
                        sender: {
                            __typename: "User",
                            id: currentUserId || "",
                        },
                        readBy: [{
                            __typename: "ReadBy",
                            user: {
                                __typename: "User",
                                id: currentUserId || "",
                            },
                        }],
                    },
                },
                update: (cache, { data: mutationData }) => {
                    if (!mutationData?.sendMessage) return;
                    cache.modify({
                        fields: {
                            getMessages(existingMessages = []) {
                                const newMessageRef = cache.writeFragment({
                                    data: mutationData.sendMessage,
                                    fragment: MESSAGE_FRAGMENT
                                });
                                return [newMessageRef, ...existingMessages];
                            }
                        }
                    });
                },
            });
            setInputValue("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    useEffect(() => {
        if (!data?.getMessages || !currentUserId) return;
        const unreadMessages = data.getMessages.filter((msg: Message) => {
            const senderId = msg?.sender?.id ?? null;
            const isOwn = senderId && String(senderId) === String(currentUserId);
            const alreadyReadByMe = (msg.readBy || []).some(
                (r: any) => String(r.user?.id || r.user?._id) === String(currentUserId)
            );
            return !isOwn && !alreadyReadByMe && !markedRef.current[msg.id];
        });
        unreadMessages.forEach((msg: any) => {
            markedRef.current[msg.id] = true;
            markAsRead({ variables: { messageId: msg.id } })
                .catch((error) => {
                    console.error("markAsRead error:", error);
                    markedRef.current[msg.id] = false;
                });
        });
    }, [data, currentUserId, markAsRead, client, conversation.id]);

    if (loading && !data)
        return (
            <div className="flex-1 flex flex-col bg-[#0a0a0f] my-0 md:my-3 mr-0 md:mr-3 md:rounded-2xl overflow-hidden">
                <ChatHeader conversation={conversation} onLeaveChat={onLeaveChat} />

                <div className="flex-1 p-6 space-y-4">
                    <div className="max-w-[60%] bg-[#111116] rounded-2xl p-4">
                        <div className="h-4 bg-[#1f1f2e] rounded mb-2 w-3/4 animate-pulse" />
                        <div className="h-4 bg-[#1f1f2e] rounded w-1/2 animate-pulse" />
                    </div>

                    <div className="ml-auto max-w-[60%] bg-[#111116] rounded-2xl p-4">
                        <div className="h-4 bg-[#1f1f2e] rounded mb-2 w-1/2 ml-auto animate-pulse" />
                        <div className="h-4 bg-[#1f1f2e] rounded w-3/4 ml-auto animate-pulse" />
                    </div>

                    <div className="max-w-[40%] bg-[#111116] rounded-2xl p-4">
                        <div className="h-4 bg-[#1f1f2e] rounded w-2/3 animate-pulse" />
                    </div>
                </div>

                <div>
                    <MessageInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSendMessage}
                        disabled={true}
                    />
                </div>
            </div>
        );

    if (error) {
        return (
            <div className="flex-1 flex flex-col bg-[#0a0a0f] my-0 md:my-3 mr-0 md:mr-3 md:rounded-2xl overflow-hidden">
                <ChatHeader conversation={conversation} onLeaveChat={onLeaveChat} />
                <div className="flex-1 flex flex-col items-center justify-center text-red-400">
                    <p className="font-medium">Failed to load messages</p>
                    <p className="text-sm opacity-70 mt-1">Please try again later</p>
                </div>
                <MessageInput
                    value={inputValue}
                    onChange={handleInputChange}
                    onSend={handleSendMessage}
                    disabled={true}
                />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#0a0a0f] my-0 md:my-3 mr-0 md:mr-3 md:rounded-2xl overflow-hidden">
            <ChatHeader conversation={conversation} onLeaveChat={onLeaveChat} />

            <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin scrollbar-thumb-[#1f1f2e]">
                {data?.getMessages && data.getMessages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center h-full text-[#6b7280]">
                        <p>No messages yet</p>
                        <p className="text-sm">Say hello!</p>
                    </div>
                )}
                {messages.map((msg: Message) => {
                    const senderId = msg?.sender?.id ?? null;
                    const date = msg?.createdAt ? new Date(msg.createdAt) : null;
                    const time =
                        date && !isNaN(date.getTime())
                            ? date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "";
                    const isOwn =
                        senderId !== null && String(senderId) === String(currentUserId);

                    const readBy = msg.readBy || [];
                    let messageStatus: any = "sent";
                    if (isOwn) {
                        const otherReaders = readBy.filter((r: any) => String(r.user?.id || r.user?._id) !== String(currentUserId));
                        if (otherReaders.length > 0) {
                            messageStatus = "seen";
                        } else {
                            messageStatus = msg.status || "sent";
                        }
                    }

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={{
                                id: msg.id,
                                text: msg.content,
                                fileUrl: msg.fileUrl,
                                fileType: msg.fileType,
                                fileName: msg.fileName,
                                time,
                                isOwn,
                                messageStatus,
                                readBy,
                            }}
                        />
                    );
                })}

                {typingUsers.length > 0 && (
                    <div className="text-[#3b82f6] text-sm mt-3">
                        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <MessageInput
                value={inputValue}
                onChange={handleInputChange}
                onSend={handleSendMessage}
            />
        </div>
    );
}