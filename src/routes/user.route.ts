import { Router } from "express";

import { deleteUser, forgotPassword, forgotPasswordMail, getAllUsers, getUserProfile, Logout, registerUser, resetPassword, updateUser, userLogin, verifyUser } from "../controllers/user.controller";
import { jwtVerifyUser } from "../utils/verifyUser";

const router = Router();
//all user routes
router.post("/registerUser", registerUser);

router.post("/verifyUser", verifyUser);

router.post("/login", userLogin);

router.post("/logout", jwtVerifyUser, Logout)

router.post("/requestForgotPassword", forgotPasswordMail);

router.post("/forgotPassword", forgotPassword);

router.post("/resetPassword", jwtVerifyUser, resetPassword);

router.delete("/deleteUser", jwtVerifyUser, deleteUser);

router.get("/getUsers", jwtVerifyUser, getAllUsers);

router.get("/getUser", jwtVerifyUser, getUserProfile);

router.put("/updateUser", jwtVerifyUser, updateUser);

export default router;
