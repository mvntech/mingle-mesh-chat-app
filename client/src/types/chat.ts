export interface Conversation {
    id: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
    lastMessage?: React.ReactNode;
    time?: string | null;
    unreadCount?: number;
    messageStatus?: "sent" | "delivered" | "read";
    isGroupChat: boolean;
}

export interface ChatHeaderProps {
    conversation: Conversation;
    onLeaveChat?: () => void;
}

export interface ChatViewProps {
    conversation: Conversation;
    currentUserId: string | null;
    typingUsers: string[];
    onLeaveChat?: () => void;
}

export interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
    isTyping?: boolean;
    isFavorite?: boolean;
}

export interface ConversationListProps {
    contacts: Conversation[];
    selectedId: string;
    onSelect: (conversation: Conversation) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading?: boolean;
    typingUsers: Record<string, string[]>;
    favorites?: string[];
}

export interface MessageInputProps {
    value: string
    onChange: (value: string) => void
    onSend: (text: string, fileData?: { fileUrl: string, fileType: string, fileName: string }) => void
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
            fileUrl?: string | null;
            fileType?: string | null;
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

export interface MingleMeshChatProps {
    activeNav: string;
    setActiveNav: (nav: string) => void;
    selectedConversation: Conversation | null;
    setSelectedConversation: (conv: Conversation | null) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    typingUsers: Record<string, string[]>;
}