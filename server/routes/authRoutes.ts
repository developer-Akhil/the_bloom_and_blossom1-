import { Router } from "express";
import { AuthController } from "../controllers/authController.js";

const router = Router();

router.post("/register", AuthController.register);
router.get("/verify-email", AuthController.verifyEmail);
router.post("/login", AuthController.login);
router.post("/resend", AuthController.resendVerification);

export default router;
