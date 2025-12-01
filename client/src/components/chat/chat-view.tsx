import { useState, useEffect, useRef } from "react";
import { ChatHeader } from "./chat-header";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MESSAGES } from "../../queries/getMessages";
import { SEND_MESSAGE } from "../../mutations/sendMessage";
import { MESSAGE_ADDED } from "../../subscriptions/messageAdded";
import type { Conversation } from "../../types/chat";

interface ChatViewProps {
  conversation: Conversation;
  currentUserId: string | null;
}

export function ChatView({ conversation, currentUserId }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const { data, loading, subscribeToMore } = useQuery(GET_MESSAGES, {
    variables: { chatId: conversation.id },
    fetchPolicy: "cache-and-network"
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: MESSAGE_ADDED,
      variables: { chatId: conversation.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newFeedItem = subscriptionData.data.messageAdded;
        if (prev.getMessages.find((msg: any) => msg.id === newFeedItem.id)) {
          return prev;
        }
        return Object.assign({}, prev, {
          getMessages: [newFeedItem, ...prev.getMessages],
        });
      },
    });
    return () => unsubscribe();
  }, [conversation.id, subscribeToMore]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.getMessages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !conversation.id) return;

    try {
      await sendMessage({
        variables: {
          chatId: conversation.id,
          content: text.trim(),
        },
      });
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading && !data)
    return (
      <div className="flex-1 flex flex-col bg-[#0a0a0f] my-3 mr-3 rounded-2xl overflow-hidden">
        <ChatHeader conversation={conversation} />

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

        <div className="p-4">
          <MessageInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            disabled={true}
          />
        </div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0f] my-3 mr-3 rounded-2xl overflow-hidden">
      <ChatHeader conversation={conversation} />

      {/* messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#1f1f2e]">
        {([... (data?.getMessages || [])].slice().reverse()).map((msg: any) => {
          const senderId = msg?.sender?.id ?? msg?.sender?._id ?? null;
          const date = msg?.createdAt ? new Date(msg.createdAt) : null;
          const time = date && !isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
          const isOwn = senderId !== null && String(senderId) === String(currentUserId);

          return (
            <MessageBubble 
              key={msg.id} 
              message={{
                id: msg.id,
                text: msg.content,
                time,
                isOwn,
              }} 
            />
          );
        })}
        <div ref={scrollRef} />
      </div>

      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
      />
    </div>
  );
}