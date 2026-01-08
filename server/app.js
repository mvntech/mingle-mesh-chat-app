import express from "express";
import { ApolloServer } from "apollo-server-express";
import { AuthenticationError } from "apollo-server-express";
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
import connectDB from "./config/database.js";
import { typeDefs, resolvers } from "./graphql/schema.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import sanitizeHtml from "sanitize-html";
import passport from "passport";
import configurePassport from "./config/passport.js";

dotenv.config();
configurePassport();

const app = express();
const httpServer = createServer(app);
const isProd = process.env.NODE_ENV === "production";

const pubsub = new PubSub();

const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
const allowedOrigins = [
    CLIENT_URL,
    SERVER_URL,
    MONGODB_URI,
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://localhost:5000"
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Blocked by CORS"), false);
        },
        credentials: true,
        methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "Origin",
            "X-Requested-With",
        ],
        exposedHeaders: ["Content-Type"],
    })
);

app.use(
    helmet({
        contentSecurityPolicy: isProd
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:"],
                    connectSrc: ["'self'", "ws:", "wss:"],
                },
            }
            : false,
        crossOriginEmbedderPolicy: isProd ? true : false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(express.json());
app.use(passport.initialize());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: "Too many auth attempts. Try again later.",
});
app.use("/graphql", (req, res, next) => {
    const body = req.body || {};
    if (
        body.query &&
        (body.query.includes("login") || body.query.includes("register"))
    ) {
        return authLimiter(req, res, next);
    }
    next();
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

const context = async ({ req, connection }) => {
    if (connection) return connection.context;
    let user = null;
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id).select("-password");
        } catch (error) {
            console.error("Error: ", error);
        }
    }
    return { user, pubsub, io, sanitizeHtml };
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const apolloServer = new ApolloServer({
    schema,
    context,
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

const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
});

useServer(
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
            } catch (err) {
                throw new AuthenticationError("Invalid token");
            }
        },
    },
    wsServer
);

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token required"));
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
        chatIds.forEach((chatId) => {
            socket.join(`chat-${chatId}`);
        });
    });

    socket.on("typing", ({ chatId, isTyping }) => {
        socket.to(`chat-${chatId}`).emit("typing", {
            chatId,
            user: { id: socket.userId, username: socket.user.username },
            isTyping,
        });
    });

    socket.on("send-message", async ({ chatId, content }) => {
        if (!content || content.length === 0) return;
        socket.to(`chat-${chatId}`).emit("new-message", {
            chatId,
            message: {
                content,
                sender: { id: socket.userId, username: socket.user.username },
            },
        });
    });

    socket.on("disconnect", async () => {
        if (socket.user) {
            const user = await User.findById(socket.userId);
            if (user) {
                user.isOnline = false;
                user.lastSeen = new Date();
                await user.save();
            }
        }
    });
});

const startServer = async () => {
    await apolloServer.start();

    apolloServer.applyMiddleware({
        app,
        path: "/graphql",
        cors: false,
    });

    const PORT = process.env.PORT || 4000;

    httpServer.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}:${apolloServer.subscriptionsPath || "/graphql"}`);
        console.log(`Subscriptions endpoint ready at ws://localhost:${PORT}${apolloServer.subscriptionsPath || "/graphql"}`);
    });

    httpServer.on("error", (error) => {
        console.error("HTTP Server Error: ", error);
        process.exit(1);
    });
};

startServer().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});
