import express from "express";
import { ApolloServer } from "apollo-server-express";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { typeDefs, resolvers } from "./graphql/schema.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
const httpServer = createServer(app);

// graphql subscriptions
const pubsub = PubSub();

// cors configuration
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.includes("localhost:5173") ||
        origin.includes("127.0.0.1:5173")
      ) {
        return callback(null, true);
      }
      if (origin === allowedOrigin) {
        return callback(null, true);
      }

      callback(null, true);
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

// initialize socket.io with cors configuration
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowEIO3: true,
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
  pingInterval: 25000,
  pingTimeout: 60000,
});

// helmet middleware after CORS (to avoid blocking options)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());

// connect to mongoDB
connectDB();

// graphql context function
const context = async ({ req, connection }) => {
  if (connection) {
    // websocket connection for subscriptions
    return connection.context;
  }

  // HTTP request
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

  return { user, pubsub, io };
};

// create graphql schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// create apollo server
const apolloServer = new ApolloServer({
  schema,
  context,
});

// socket.io connection handling
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

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
        next(new Error("User not found"));
      }
    } catch (error) {
      next(new Error("Authentication error"));
    }
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  // join user's rooms (chats they're part of)
  socket.on("join-chats", async (chatIds) => {
    chatIds.forEach((chatId) => {
      socket.join(`chat-${chatId}`);
    });
  });

  // handle typing indicator
  socket.on("typing", ({ chatId, isTyping }) => {
    socket.to(`chat-${chatId}`).emit("typing", {
      chatId,
      user: socket.user,
      isTyping,
    });
  });

  // handle new message via socket.io
  socket.on("send-message", async ({ chatId, content }) => {
    socket.to(`chat-${chatId}`).emit("new-message", {
      chatId,
      message: { content, sender: socket.user },
    });
  });

  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.user.username}`);
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

// start apollo server
const startServer = async () => {
  await apolloServer.start();

  // apply apollo middleware
  apolloServer.applyMiddleware({
    app,
    path: "/graphql",
    cors: false,
  });

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(
      `Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });

  httpServer.on("error", (error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
