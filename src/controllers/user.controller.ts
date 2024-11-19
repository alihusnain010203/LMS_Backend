import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { IUserLogin, IUserRegistration } from "../types/user.types";
import jwt from "jsonwebtoken";
import { catchAsyncError } from "../middlewares/catchAsyncError";
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
            isVerified: true,
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
            email: email,
            role: user.role,
            id: user._id,
        }, process.env.JWT_SECRET as string);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",

        });

        res.status(200).json({
            message: "Login Successfully",
        });
    } catch (error: any) {
        next(new ErrorHandler(error.message, 400));

    }

})

export const Logout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.body.isVerfied) {
            res.clearCookie("token");
            res.status(200).json({
                message: "Logout Successfully",
            });
        }
    } catch (error: any) {
        next(new ErrorHandler(error.message, 400));
    }
})

export const forgotPasswordMail = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const isEmailExist = await User.findOne({
            email
        });
        if (!isEmailExist) {
            return next({
                message: "Email not found",
                statusCode: 400,
            });
        }
        const { resetPasswordToken, coder4digit } = resetPasswordTokenCode(email);
        const mail = await sendMail(
            {
                email,
                subject: "Reset Password",
                template: "reset-password.ejs",
                data: {
                    coder4digit,
                },
            }
        );
        res.status(200).json({
            success: true,
            message: `Reset password code sent to ${email}`,
            resetPasswordToken,
        });

    } catch (error: any) {
        next(new ErrorHandler(error.message, 400));
    }
});

export const forgotPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { resetPasswordToken, code, password } = req.body;
        const { email } = jwt.verify(resetPasswordToken, process.env.JWT_SECRET as string) as { email: string, code: number };
        if (code !== Number(code)) {
            return next({
                message: "Invalid code",
                statusCode: 400,
            });
        }
        const user = await User.findOne({
            email
        });
        if (!user) {
            return next({
                message: "Email not found",
                statusCode: 400,
            });
        };
        user.password = password;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });

    } catch (error: any) {

        next(new ErrorHandler(error.message, 400));
    }
});

export const resetPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const isEmailExist = await User.findOne({
            email
        });
        if (!isEmailExist) {
            return next({
                message: "Email not found",
                statusCode: 400,
            });
        }
        isEmailExist.password = password;
        await isEmailExist.save();
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });

    } catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })

    }
});

export const getUserProfile = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findOne({
            email: req.body.email
        });
        if (!user) {
            return next({
                message: "User not found",
                statusCode: 400,
            });
        }
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })
    }
});

export const getAllUsers = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, email } = req.body;
        if (role !== "admin" && email !== process.env.ADMIN_EMAIL) {
            return next({
                message: "You are not authorized to change role",
                statusCode: 400,
            });
        }
        const users = await User.find();
        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })
    }
});

export const deleteUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, email } = req.body;
        if (role !== "admin" && email !== process.env.ADMIN_EMAIL) {
            return next({
                message: "You are not authorized to change role",
                statusCode: 400,
            });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return next({
                message: "User not found",
                statusCode: 400,
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })
    }
});

export const updateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, avatar } = req.body;
        const data: {
            name?: string;
            avatar?: string;
        } = {};
        if (name) {
            data.name = name;
        }
        if (avatar) {
            data.avatar = avatar;
        }
        const user = await User.findOneAndUpdate({
            email: req.body.email
        }, data)
        if (!user) {
            return next({
                message: "User not found",
                statusCode: 400,
            });
        }
        res.status(200).json({
            success: true,
            message: "User updated successfully",
        });
    }
    catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })
    }
}
);

export const changedRole = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, email } = req.body;
        if (role !== "admin" && email !== process.env.ADMIN_EMAIL) {
            return next({
                message: "You are not authorized to change role",
                statusCode: 400,
            });
        }
        const data: {
            role?: string;
        } = {};
        if (role) {
            data.role = role;
        }
        const user = await User.findOneAndUpdate({
            email: req.body.email
        }, data)
        if (!user) {
            return next({
                message: "User not found",
                statusCode: 400,
            });
        }
        res.status(200).json({
            success: true,
            message: "Role updated successfully",
        });
    } catch (error) {
        next({
            message: "Internal Server Error",
            statusCode: 400,
        })
    }
});

const resetPasswordTokenCode = (email: string) => {
    const coder4digit = Math.floor(1000 + Math.random() * 9000);
    const resetPasswordToken = jwt.sign({
        email: email,
        code: coder4digit,
    }, process.env.JWT_SECRET as string, {
        expiresIn: "5m"
    });
    return { resetPasswordToken, coder4digit };
}