export interface Conversation {
  id: string;
  name: string;
  avatar: string | null;
  isOnline: boolean;
  lastMessage?: string | null;
  time?: string | null;
  unreadCount?: number;
  isGroupChat: boolean;
}
