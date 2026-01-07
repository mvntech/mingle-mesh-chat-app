import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function createSocket() {
    if (socket) {
        if (socket.disconnected) {
            socket.connect();
        }
        return socket;
    }
    const token = localStorage.getItem("token") || "";
    socket = io("http://localhost:5000", {
        auth: { token },
        autoConnect: true,
    });
    window.addEventListener("storage", (e) => {
        if (e.key === "token") {
            const newToken = e.newValue || "";
            reconnectWithToken(newToken);
        }
    });
    return socket;
}

export function reconnectWithToken(newToken: string) {
    if (!socket) {
        socket = createSocket();
        return socket;
    }
    try {
        socket.auth = { token: newToken }
        if (socket.connected) {
            socket.disconnect();
        }
        socket.connect();
    } catch (err) {
        try {
            socket.close?.();
        } catch (e) {
            console.error(e);
        }
        socket = io("http://localhost:5000", { auth: { token: newToken } });
    }
    return socket;
}

export function getSocket() {
    return socket;
}

export default createSocket;