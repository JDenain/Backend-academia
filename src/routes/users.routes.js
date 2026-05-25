import { Router } from "express";
import { getAllUsers, getUserById, createUser, deleteUser, updateUser, updateUserPassword } from "../controllers/users.controllers.js";
import { authenticateToken, authorize } from "../controllers/auth.middleware.js"

const router = Router();

// Admin = 1, Root = 4. 
router.get("/api/users", authenticateToken, authorize(1, 4), getAllUsers);

// Any authenticated user can get their own info, or admin can get anyone. The controller needs to handle this.
router.get("/api/users/:id", authenticateToken, getUserById);

router.post("/api/users", authenticateToken, authorize(1, 4), createUser);

router.delete("/api/users/:id", authenticateToken, authorize(1, 4), deleteUser);

// Any authenticated user can update themselves. Admin can update anyone. Controller will check.
router.put("/api/users/:id", authenticateToken, updateUser);

router.put("/api/users/password/:id", authenticateToken, updateUserPassword);

export default router;
