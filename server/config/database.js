import mongoose from "mongoose";

const connectDB = async () => {
    let connected = false;
    while (!connected) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                dbName: process.env.MONGODB_NAME,
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            connected = true;
        } catch (error) {
            console.error(`Error connecting to MongoDB: ${error.message}`);
            console.log("Retrying in 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

export default connectDB;