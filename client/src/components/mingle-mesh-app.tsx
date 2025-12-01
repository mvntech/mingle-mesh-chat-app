import { useState } from "react";
import { Sidebar } from "./chat/sidebar";
import { ConversationList } from "./chat/conversation-list";
import { ChatView } from "./chat/chat-view";
import { type Conversation } from "../types/chat";
import { useQuery } from "@apollo/client/react";
import { GET_ME } from "../queries/getMe";
import { GET_CHATS } from "../queries/getChats";
import { MessageCircle } from "lucide-react";
import type { GetMeData } from "../types/user";

export function MingleMeshApp() {
  const [activeNav, setActiveNav] = useState<string>("home");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading: chatsLoading } = useQuery(GET_CHATS);
  const { data: userData } = useQuery<GetMeData>(GET_ME);
  const currentUserId = userData?.me?.id ?? localStorage.getItem("userId");

  const chats: Conversation[] = data
    ? data.getChats.map((chat: any) => {
        const other = chat.participants.find((p: any) => p.id !== currentUserId) || chat.participants[0];

        return {
          id: chat.id,
          name: chat.name || other.username,
          avatar: other.avatar,
          isOnline: other.isOnline,
          lastMessage: chat.lastMessage?.content || "",
          time: chat.lastMessage
            ? new Date(chat.lastMessage.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "",
          isGroupChat: chat.isGroupChat,
        };
      })
    : [];

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden font-sans">  
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} user={userData?.me} />
      
      <ConversationList
        groups={chats.filter((chat) => chat.isGroupChat)}
        contacts={chats.filter((chat) => !chat.isGroupChat)}
        selectedId={selectedConversation?.id || ""}
        onSelect={setSelectedConversation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        loading={chatsLoading}
      />

      {/* conditional rendering */}
      {selectedConversation ? (
        <ChatView conversation={selectedConversation} currentUserId={currentUserId} />
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