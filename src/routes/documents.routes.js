import { Router } from "express";
import { downloadDocumentFile, uploadFileToDocument, uploadDocument, getDocuments, getDocumentById, updateDocument, deleteDocument } from "../controllers/documents.controllers.js";
import { authenticateToken, authorize } from "../controllers/auth.middleware.js"

const router = Router();
router.use(authenticateToken);


router.get("/api/documents", getDocuments);

router.get("/api/documents/:id", getDocumentById);

router.post("/api/documents", uploadDocument);

router.post("/api/documents/:id/files", authenticateToken, uploadFileToDocument);

router.get("/api/documents/:id/files/:filename", authenticateToken, downloadDocumentFile);

router.patch("/api/documents/:id", authorize([1, 2]), updateDocument);

router.delete("/api/documents/:id", authorize([1, 4]), deleteDocument);

export default router;