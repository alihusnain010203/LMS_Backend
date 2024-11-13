import mongoose from "mongoose";

const connectDB = async () => {
    try {
       
        if (!process.env.MONGO_URI) {
            throw new Error("DB_URI is not defined")
        } else {
            const conn = await mongoose.connect(process.env.MONGO_URI);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Database connection error: ${error.message}`);
        }
         throw error;
    }
};

export default connectDB;