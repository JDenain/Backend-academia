import { Router } from "express";
import { uploadDocument, getDocuments, getDocumentById, updateDocument, deleteDocument, downloadDocument } from "../controllers/documents.controllers.js";
import { authenticateToken, authorize } from "../controllers/auth.middleware.js"

const router = Router();
router.use(authenticateToken);


router.get("/api/documents", getDocuments);

router.get("/api/documents/:id", getDocumentById);

router.get("/api/documents/:id/download", downloadDocument);

router.post("/api/documents", authorize([1, 2]), uploadDocument);

router.patch("/api/documents/:id", authorize([1, 2]), updateDocument);

router.delete("/api/documents/:id", authorize([1, 4]), deleteDocument);

export default router;