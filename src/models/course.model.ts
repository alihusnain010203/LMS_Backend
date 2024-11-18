import mongoose, { Schema, Document } from "mongoose";
import { User } from "./user.model";

interface ICourse extends Document {
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    sections: Array<{
        title: string;
        description: string;
       

    }>;
    price: number;
    users: Array<typeof User>;
    purchasedAt: Date;
    courseCreator: typeof User;
    isValidated: boolean;
}

const courseSchema: Schema<ICourse> = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    category: {
        type: String,
        required: [true, "Category is required"],
    },
    thumbnail: {
        type: String,
        required: [true, "Thumbnail is required"],
    },
    sections: [
        {
            title: String,
            description: String,
        }
    ],
    users: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    price: {
        type: Number,
        required: [true, "Price is required"],
    },
    purchasedAt: {
        type: Date,
        default: Date.now,
    },
    courseCreator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    isValidated: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true })

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
