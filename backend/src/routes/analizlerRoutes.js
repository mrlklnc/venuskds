import express from "express";
import { getIlceUygunlukSkoruAnalizler } from "../controllers/dssController.js";

const router = express.Router();

/**
 * GET /api/analizler/ilce-uygunluk-skoru
 * Returns district suitability score (Konak excluded)
 */
router.get("/ilce-uygunluk-skoru", getIlceUygunlukSkoruAnalizler);

export default router;

