import express from "express";
import { ApolloServer } from "apollo-server-express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import connectDB from "./config/database.js";
import { typeDefs, resolvers } from "./graphql/schema.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(express.json());

await connectDB();

const context = async ({ req }) => {
    const token = req.headers.authorization?.split(" ")[1];

    let user = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id).select("-password");
        } catch (err) {
            console.error("Auth error:", err.message);
        }
    }

    return { user };
};

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context,
});

await apolloServer.start();

apolloServer.applyMiddleware({
    app,
    path: "/graphql",
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/graphql`);
});
