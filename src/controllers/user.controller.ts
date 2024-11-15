import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { IUserLogin, IUserRegistration } from "../types/user.types";
import jwt from "jsonwebtoken";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import bcrypt from "bcryptjs"

import sendMail from "../utils/sendMail";
import ErrorHandler from "../utils/ErrorHandler";

export const registerUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, password, avatar }: IUserRegistration = req.body;


        const isEmailExist = await User.findOne({
            email
        });
        if (isEmailExist) {
            return next({
                message: "Email already exists",
                statusCode: 400,
            });
        }

        const { activationToken, coder4digit } = activationTokenCode({ email, name, password, avatar });




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

export const verifyUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activationToken, code } = req.body;
        const { email, password, avatar, name, code: activationCode } = jwt.verify(activationToken, process.env.JWT_SECRET as string) as { email: string, name: string, code: number, password: string, avatar: string };

        if (activationCode !== Number(code)) {
            return next({
                message: "Invalid code",
                statusCode: 400,
            });
        }

        const isEmailExist = await User.findOne({
            email
        });
        if (isEmailExist) {
            return next({
                message: "Email already exists",
                statusCode: 400,
            });
        }
        await User.create({
            email,
            name,
            password,
            avatar,
        });
        res.status(200).json({
            success: true,
            message: "Account verified"
        });
    } catch (error: any) {
        next(new ErrorHandler(error.message, 400));

    }
});

const activationTokenCode = (user: IUserRegistration) => {
    const coder4digit = Math.floor(1000 + Math.random() * 9000);
    const activationToken = jwt.sign({
        name: user.name,
        email: user.email,
        password: user.password,
        avatar: user.avatar,
        code: coder4digit,
    }, process.env.JWT_SECRET as string, {
        expiresIn: "5m"
    });
    return { activationToken, coder4digit };
}

export const userLogin = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password }: IUserLogin = req.body;
        
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
          }
    
          const user = await User.findOne({ email }).select("+password");
    
          if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
          }
    
          const isPasswordMatch = await user.comparePassword(password);
          if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
          }
     
      

        

        const token = jwt.sign({
            email: email
        }, process.env.JWT_SECRET as string);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",

        });

        res.status(200).json({
            message: "Login Successfully",
        });
    } catch (error :any) {
        next(new ErrorHandler(error.message, 400));

    }

})

export const Logout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        })
        res.status(201).json({
            message: "Successfully logged Out"
        })
    } catch (error: any) {
        next(new ErrorHandler(error.message, 400));
    }
})