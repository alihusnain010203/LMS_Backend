import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db";
import { errorHandle } from "./middlewares/error";



const app = express();

dotenv.config();

// cors
app.use(cors({
    origin: process.env.ORIGIN,
}))
// body parser
app.use(express.json({
    limit: "50mb"
}));
// cookie parser
app.use(cookieParser());
// logger
app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms'
    ].join(' ')
}))


app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
})

app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`${req.originalUrl} not found`) as any;
    err.status = 404;
    next(err);
})

app.use(errorHandle);

// Global error handler
app.use((err: {
    status: number;
    message: string;
    stack: string;
}, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    res.json({
        error: {
            status: err.status || 500,
            message: err.message
        },
    });

});

connectDB();

export default app;