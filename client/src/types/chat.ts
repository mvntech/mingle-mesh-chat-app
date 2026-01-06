export interface Conversation {
    id: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
    lastMessage?: string | null;
    time?: string | null;
    unreadCount?: number;
    messageStatus?: "sent" | "delivered" | "read";
    isGroupChat: boolean;
}

export interface ChatHeaderProps {
    conversation: Conversation
}

export interface ChatViewProps {
    conversation: Conversation;
    currentUserId: string | null;
}

export interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
}

export interface ConversationListProps {
    contacts: Conversation[];
    selectedId: string;
    onSelect: (conversation: Conversation) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading?: boolean;
}

export interface MessageInputProps {
    value: string
    onChange: (value: string) => void
    onSend: (text: string) => void
    disabled?: boolean
}