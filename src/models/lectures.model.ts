import mongoose, { Schema, Document } from "mongoose";

export interface ILecture extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoPublicId: string;
}

const lectureSchema: Schema<ILecture> = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    videoUrl: {
        type: String,
        required: [true, "Video URL is required"],
    },
    videoPublicId: {
        type: String,
        required: [true, "Video Public ID is required"],
    },
});
