import { Socket } from "socket.io-client";

export interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

export interface SocketProviderProps {
    children: React.ReactNode;
}