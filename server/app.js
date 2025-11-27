import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Mingle Mesh Server Running!");
});

// connect to mongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}!`);
});
