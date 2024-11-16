import { Router } from "express";

import { forgotPassword, forgotPasswordMail, Logout, registerUser, resetPassword, userLogin ,verifyUser} from "../controllers/user.controller";
import { jwtVerifyUser } from "../utils/verifyUser";

const router = Router();

router.post("/registerUser", registerUser);

router.post("/verifyUser", verifyUser);

router.post("/login",userLogin);

router.post("/logout",jwtVerifyUser,Logout)

router.post("/requestForgotPassword", forgotPasswordMail);

router.post("/forgotPassword", forgotPassword);

router.post("/resetPassword", jwtVerifyUser,resetPassword);



export default router;
