import { Router } from "express";

import { Logout, registerUser, userLogin ,verifyUser} from "../controllers/user.controller";
import { jwtVerifyUser } from "../utils/verifyUser";

const router = Router();

router.post("/registerUser", registerUser);

router.post("/verifyUser", verifyUser);

router.post("/login",userLogin);

router.post("/logout",jwtVerifyUser,Logout)

export default router;
