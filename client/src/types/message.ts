export type MessageStatus = "sent" | "delivered" | "seen";

export interface ReadByEntry {
    user: {
        id: string;
        __typename?: string;
    };
    readAt?: string | null;
    __typename?: string;
}

export interface Message {
    id: string;
    content?: string | null;
    fileUrl?: string | null;
    fileType?: string | null;
    fileName?: string | null;
    createdAt: string;
    status: MessageStatus;
    sender: {
        id: string;
        __typename?: string;
    };
    readBy: ReadByEntry[];
    __typename?: string;
}

export interface GetMessagesData {
    getMessages: Message[];
}

export interface SendMessageData {
    sendMessage: Message;
}

export interface SendMessageVars {
    chatId: string;
    content?: string | null;
    fileUrl?: string | null;
    fileType?: string | null;
    fileName?: string | null;
}

export interface ChatMessage {
    id: string;
    text?: string | null;
    fileUrl?: string | null;
    fileType?: string | null;
    fileName?: string | null;
    time: string;
    isOwn: boolean;
    messageStatus: MessageStatus | "seen";
    readBy: ReadByEntry[];
}