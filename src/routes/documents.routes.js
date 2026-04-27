import { Router } from "express";
import { uploadDocument, getDocuments, getDocumentById, updateDocument, deleteDocument, downloadDocument } from "../controllers/documents.controllers.js";
import { authenticateToken, authorize } from "../controllers/auth.middleware.js"

const router = Router();
router.use(authenticateToken);


router.get("/api/documents", getDocuments);

router.get("/api/documents/:id", getDocumentById);

router.get("/api/documents/:id/download", downloadDocument);

router.post("/api/documents", authorize(['Administrador', 'Editor']), uploadDocument);

router.patch("/api/documents/:id", authorize(['Administrador', 'Editor']), updateDocument);

router.delete("/api/documents/:id", authorize(['Administrador', 'root']), deleteDocument);

export default router;