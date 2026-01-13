import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import passport from "passport";
import sanitizeHtml from "sanitize-html";
import connectDB from "./config/database.js";
import { typeDefs, resolvers } from "./graphql/schema.js";
import User from "./models/User.js";
import Chat from "./models/Chat.js";
import configurePassport from "./config/passport.js";

dotenv.config();
configurePassport();

const app = express();
const httpServer = createServer(app);
const pubsub = new PubSub();

const CLIENT_URL = process.env.CLIENT_URL;
const SERVER_URL = process.env.SERVER_URL;
const allowedOrigins = [CLIENT_URL, SERVER_URL];

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "wss:", "https:"],
                fontSrc: ["'self'", "data:", "https:"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"]
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin" },
    })
);

app.use(passport.initialize());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: "Too many auth attempts. Try again later.",
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: `${CLIENT_URL}/login`, session: false }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_EXPIRE });
        res.redirect(`${CLIENT_URL}/auth-callback?token=${token}`);
    }
);

app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: `${CLIENT_URL}/login`, session: false }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_EXPIRE });
        res.redirect(`${CLIENT_URL}/auth-callback?token=${token}`);
    }
);

await connectDB();

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
});

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
});

const serverCleanup = useServer(
    {
        schema,
        context: async (ctx) => {
            const connectionParams = ctx.connectionParams || {};
            const token = connectionParams.authToken;
            if (!token) throw new AuthenticationError("Auth token required");
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select("-password");
                if (!user) throw new AuthenticationError("User not found");
                return { user, pubsub, io, sanitizeHtml };
            } catch (error) {
                console.error("Error processing authentication:", error.message);
                throw new AuthenticationError("Invalid token");
            }
        },
    },
    wsServer
);

const server = new ApolloServer({
    schema,
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
});

await server.start();

const graphqlRateLimiter = (req, res, next) => {
    const body = req.body || {};
    if (
        body.query &&
        (body.query.includes("login") || body.query.includes("register"))
    ) {
        return authLimiter(req, res, next);
    }
    next();
};

app.use(
    "/graphql",
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Blocked by CORS"), false);
        },
        credentials: true,
        methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
        exposedHeaders: ["Content-Type"],
    }),
    express.json(),
    graphqlRateLimiter,
    expressMiddleware(server, {
        context: async ({ req }) => {
            let user = null;
            const token = req.headers.authorization?.split(" ")[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    user = await User.findById(decoded.id).select("-password");
                } catch (error) {
                    console.error("Error processing authentication:", error.message);
                }
            }
            return { user, pubsub, io, sanitizeHtml };
        },
    })
);

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token required"));
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return next(new Error("Authentication error: Token expired"));
            }
            const user = await User.findById(decoded.id).select("-password");
            if (user) {
                socket.userId = user._id.toString();
                socket.user = user;
                user.isOnline = true;
                await user.save();
                next();
            } else {
                next(new Error("Authentication error: User not found"));
            }
        } catch (error) {
            console.error("Socket Auth Error:", error.message);
            next(new Error("Authentication error: Invalid token"));
        }
    } else {
        next(new Error("Authentication error: Token required"));
    }
});

io.on("connection", (socket) => {
    socket.join(`user-${socket.userId}`);
    socket.on("join-chats", async (chatIds) => {
        if (!Array.isArray(chatIds)) return;
        try {
            const validChats = await Chat.find({
                _id: { $in: chatIds },
                participants: { $in: [socket.userId] },
                deletedBy: { $ne: socket.userId }
            }).select("_id");
            validChats.forEach((chat) => {
                socket.join(`chat-${chat._id.toString()}`);
            });
        } catch (error) {
            console.error("Error joining chats:", error);
        }
    });
    socket.on("leave-chat", (chatId) => {
        socket.leave(`chat-${chatId}`);
    });
    socket.on("typing", async ({ chatId, isTyping }) => {
        try {
            const chat = await Chat.findOne({
                _id: chatId,
                participants: { $in: [socket.userId] }
            });
            if (chat) {
                socket.to(`chat-${chatId}`).emit("typing", {
                    chatId,
                    user: { id: socket.userId, username: socket.user.username },
                    isTyping,
                });
            }
        } catch (error) {
            console.error("Error in typing event:", error);
        }
    });
    socket.on("disconnect", async () => {
        if (socket.user) {
            setTimeout(async () => {
                const activeConnections = await io.in(`user-${socket.userId}`).fetchSockets();
                if (activeConnections.length === 0) {
                    const user = await User.findById(socket.userId);
                    if (user) {
                        user.isOnline = false;
                        user.lastSeen = new Date();
                        await user.save();
                        io.emit("userStatusChanged", user.toJSON());
                    }
                }
            }, 5000);
        }
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions endpoint ready at ws://localhost:${PORT}/graphql`);
});

httpServer.on("error:", (error) => {
    console.error("HTTP Server Error: ", error);
    process.exit(1);
});
