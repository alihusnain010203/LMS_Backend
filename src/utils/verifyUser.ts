import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
export const jwtVerifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const token = req.cookies.token;

        const decode = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string, name: string, code: number, password: string, avatar: string };
        if (decode.email !== email) {
            return next({
                message: "Bad Request",
                statusCode: 400
            })
        }
        req.body.isVerfied = true;
        next()
    } catch (error) {

        next({
            message: "Bad Request",
            statusCode: 400
        })
    }
}