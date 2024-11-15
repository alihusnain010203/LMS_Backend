import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { IActivationToken, IUserRegistration } from "../types/user.types";
import jwt from "jsonwebtoken";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";

export const registerUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, password, avatar }: IUserRegistration = req.body;


        const isEmail = await User.findOne({
            email
        });
        if (isEmail) {
           return next({
                message: "Email already exists",
                statusCode: 400,
            });
        }

        const { activationToken, coder4digit } = activationTokenCode({ email, name });


        await User.create({
            email,
            name,
            password,
            avatar,
        });

        const mail = await sendMail(
            {
                email,
                subject: "Account Activation",
                template: "activation-mail.ejs",
                data: {
                    user: { name },
                    coder4digit,
                },
            }
        );

        res.status(201).json({
            success: true,
            message: `Activation code sent to ${email}`,
            activationToken,
        });
    } catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })
    }

})

const activationTokenCode = (user: IActivationToken) => {
    const coder4digit = Math.floor(1000 + Math.random() * 9000);
    const activationToken = jwt.sign({
        name: user.name,
        email: user.email,
        code: coder4digit,
    }, process.env.JWT_SECRET as string, {
        expiresIn: "5m"
    });
    return { activationToken, coder4digit };
}