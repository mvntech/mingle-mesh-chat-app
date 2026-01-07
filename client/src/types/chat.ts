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
    typingUsers: string[];
}

export interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
    isTyping?: boolean;
}

export interface ConversationListProps {
    contacts: Conversation[];
    selectedId: string;
    onSelect: (conversation: Conversation) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading?: boolean;
    typingUsers: Record<string, string[]>;
}

export interface MessageInputProps {
    value: string
    onChange: (value: string) => void
    onSend: (text: string) => void
    disabled?: boolean
}

export interface CreateChatData {
    createChat: {
        id: string;
        name?: string | null;
        avatar?: string | null;
        isGroupChat: boolean;
        participants: {
            id: string;
            username: string;
            avatar?: string | null;
            isOnline: boolean;
        }[];
        lastMessage?: {
            content: string;
            createdAt: string;
        } | null;
        messageStatus?: string;
        unreadCount?: number;
    };
}

export interface CreateChatVars {
    participantIds: string[];
    isGroupChat: boolean;
}

export interface GetChatsData {
    getChats: Array<{
        id: string;
        name?: string | null;
        isGroupChat: boolean;
        messageStatus?: "sent" | "delivered" | "read";
        unreadCount?: number | null;
        lastMessage?: {
            content?: string | null;
            createdAt: string;
        } | null;
        participants: Array<{
            id: string;
            username: string;
            avatar: string | null;
            isOnline: boolean;
        }>;
    }>;
}