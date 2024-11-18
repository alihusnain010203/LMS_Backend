import mongoose, { Schema, Document } from "mongoose";
import { ILecture } from "./lectures.model";
export interface ICourseSection extends Document {
    title: string;
    description: string;
    videoUrl: Array<ILecture>
}

const courseSectionSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    videoUrl: {
        type: Array<ILecture>,
    },
})