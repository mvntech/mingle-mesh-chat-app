import { useState } from "react"
import { Sidebar } from "./chat/sidebar"
import { ConversationList } from "./chat/conversation-list"
import { ChatView } from "./chat/chat-view"
import { groupChats, contacts, type Conversation } from "../lib/chat-data"

export function MingleMeshApp() {
  const [activeNav, setActiveNav] = useState<string>("chat")
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(contacts[1])
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGroups = groupChats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      <ConversationList
        groups={filteredGroups}
        contacts={filteredContacts}
        selectedId={selectedConversation.id}
        onSelect={setSelectedConversation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ChatView conversation={selectedConversation} />
    </div>
  )
}
