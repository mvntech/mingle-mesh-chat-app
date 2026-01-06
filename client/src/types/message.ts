export type MessageStatus = "sent" | "delivered" | "seen";

export interface ReadByEntry {
    user: { id: string };
    readAt?: string | null;
}

export interface ChatMessage {
    id: string;
    text: string;
    time: string;
    isOwn: boolean;
    messageStatus: MessageStatus;
    readBy: ReadByEntry[];
}