import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import Course from "../models/course.model";
import { ICourseRegistration, ILectureUpload } from "../types/course.types";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary, { UploadApiResponse } from 'cloudinary';
import { ICourseSection } from "../types/course.types";
import Queue from 'bull';

// Create a video upload queue
const videoUploadQueue = new Queue('videoUpload', {
    redis: {
        host: 'localhost',
        port: 6379
    }
});

// Process queue items one at a time
videoUploadQueue.process(async (job) => {
    const { lectureVideo, options } = job.data;
    
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) reject(error);
                //@ts-ignore
                else if (result) resolve(result);
                else reject(new Error('Upload failed - no result returned'));
            }
        );

        const bufferStream = require('stream').Readable.from(lectureVideo.buffer);
        bufferStream.pipe(uploadStream);
    });
});

// create Course

export const createCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, thumbnail, category, price, courseCreator } = req.body as ICourseRegistration;
        const isCourseExist = await Course.findOne({ title });
        if (isCourseExist) {
            return next({
                message: "Course already exists with this title",
                statusCode: 400,
            })
        }
        const course = await Course.create({ title, description, thumbnail, category, price, courseCreator });
        res.status(201).json({
            success: true,
            course,
        })

    } catch (error: any) {
        next(new ErrorHandler(error.message, 500));

    }
})

// create Section of course

export const createSection = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, courseId }: ICourseSection = req.body;
        const isSectionExist = await Course.findById(courseId).select("sections").find((section: ICourseSection) => section.title === title);

        // if section with same title already exists
        if (isSectionExist) {
            return next(new ErrorHandler("Section with same title already exists", 400));
        }

        const course = await Course.findByIdAndUpdate(courseId, {
            $push: {
                sections: { title, description }
            }
        });
        res.status(201).json({
            success: true,
            course,
        })

    } catch (error: any) {
        next(new ErrorHandler(error.message, 500));
    }
})



// upload lecture
export const uploadLecture = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description } = req.body;
        const lectureVideo = req.file;

        if (!title || !description || !lectureVideo) {
            return next(new ErrorHandler("Please provide all fields", 400));
        }

        // Create SSE connection
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Add job to queue
        const job = await videoUploadQueue.add({
            lectureVideo,
            options: {
                resource_type: "video",
                folder: "course-lectures",
            }
        });

        // Send initial status
        res.write(`data: ${JSON.stringify({
            success: true,
            message: "Upload queued",
            jobId: job.id
        })}\n\n`);
        // Listen for job progress
        job.progress().then((progress: number) => {
            res.write(`data: ${JSON.stringify({
                success: true,
                message: "Upload in progress",
                progress,
                jobId: job.id
            })}\n\n`);
        });

        try {
            const uploadResponse: UploadApiResponse = await job.finished();

            // Send success response
            res.write(`data: ${JSON.stringify({
                success: true,
                message: "Upload completed",
                lecture: {
                    title,
                    description,
                    videoUrl: uploadResponse.secure_url,
                    videoPublicId: uploadResponse.public_id
                },
                jobId: job.id
            })}\n\n`);
        } catch (error: any) {
            // Send error response
            res.write(`data: ${JSON.stringify({
                success: false,
                message: "Upload failed",
                error: error.message,
                jobId: job.id
            })}\n\n`);
        }

        // Close the connection
        res.write(`data: ${JSON.stringify({ type: 'close' })}\n\n`);
        res.end();

    } catch (error: any) {
        next(new ErrorHandler(error.message, 500));
    }
});

// Optional: Get upload status
export const getUploadStatus = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { jobId } = req.params;
    
    const job = await videoUploadQueue.getJob(jobId);
    if (!job) {
        return next(new ErrorHandler("Upload job not found", 404));
    }

    const state = await job.getState();
    const progress = await job.progress();
    
    res.status(200).json({
        success: true,
        jobId,
        state,
        progress
    });
});

