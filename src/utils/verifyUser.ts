import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
export const jwtVerifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return next({
                message: "Bad Request",
                statusCode: 400
            })
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string, name: string, exp: number, role: string };

        if (!decode) {
            return next({
                message: "Token is not valid",
                statusCode: 400
            })
        }
        if (decode.exp < Date.now()) {
            return next({
                message: "Token is expired",
                statusCode: 400
            })
        }
        req.body.role = decode.role;
        req.body.email = decode.email;
        next()
    } catch (error) {

        next({
            message: "Bad Request",
            statusCode: 400
        })
    }
}