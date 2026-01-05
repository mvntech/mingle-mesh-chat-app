import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/database.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome from the server!");
});

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });
