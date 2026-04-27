import { Router } from "express";
import { getAllUsers, getUserById, createUser, deleteUser, updateUser, updateUserPassword } from "../controllers/users.controllers.js";
import { authenticateToken, authorize } from "../controllers/auth.middleware.js"

const router = Router();

// Define your user-related routes here
router.get("/users", getAllUsers);

router.get("/users/:id", authenticateToken, authorize('Administrador'), getUserById);

router.post("/users", authenticateToken, authorize('Administrador'), createUser);

router.delete("/users/:id", authenticateToken, authorize('Administrador'), deleteUser);

router.put("/users/:id", updateUser);

router.put("/users/password/:id", updateUserPassword);

export default router;
