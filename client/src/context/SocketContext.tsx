import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import type { SocketContextType, SocketProviderProps } from '../types/socket';

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = io(import.meta.env.VITE_WS_URL || "http://localhost:5000", {
            auth: { token: token || "" },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            randomizationFactor: 0.5,
            timeout: 20000,
        });

        newSocket.on('connect', () => {
            console.log("Socket connected:", newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket connection error:", err);
            setIsConnected(false);
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
            if (attemptNumber > 1) {
                toast.loading(`Reconnecting... (attempt ${attemptNumber})`, { id: 'reconnect' });
            }
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log(`Reconnected after ${attemptNumber} attempts`);
            toast.success('Reconnected!', { id: 'reconnect' });
        });

        newSocket.on('reconnect_failed', () => {
            toast.error('Failed to reconnect. Please refresh the page.', { id: 'reconnect' });
        });

        setSocket(newSocket);

        return () => {
            newSocket.removeAllListeners();
            newSocket.close();
            setSocket(null);
        };
    }, []);
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' && socket) {
                const newToken = e.newValue;
                if (newToken) {
                    socket.auth = { token: newToken };
                    if (socket.connected) {
                        socket.disconnect().connect();
                    } else {
                        socket.connect();
                    }
                } else {
                    socket.disconnect();
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
