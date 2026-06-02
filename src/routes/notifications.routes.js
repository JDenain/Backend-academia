import { Router } from "express";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteReadNotifications } from "../controllers/notifications.controllers.js";
import { authenticateToken } from "../controllers/auth.middleware.js";

const router = Router();

router.get("/api/notifications", authenticateToken, getNotifications);
router.get("/api/notifications/count", authenticateToken, getUnreadCount);
router.put("/api/notifications/:id/read", authenticateToken, markAsRead);
router.put("/api/notifications/read-all", authenticateToken, markAllAsRead);
router.delete("/api/notifications/read", authenticateToken, deleteReadNotifications);

export default router;
