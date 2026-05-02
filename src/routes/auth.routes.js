import { Router } from "express";
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, register, userLogin, refreshToken, biometricLogin } from "../controllers/auth.controllers.js";
import { validateRegister, validateLogin } from "../controllers/auth.validator.js";


const router = Router();

router.post("/api/register", validateRegister, register);

router.post('/api/login', validateLogin, userLogin);

router.post('/api/refresh-token', refreshToken);

router.post('/api/login/biometric', biometricLogin);

export default router;