import express from "express";

import musteriRoutes from "./musteri.js";
import randevuRoutes from "./randevu.js";
import hizmetRoutes from "./hizmet.js";
import ilceRoutes from "./ilce.js";
import kampanyaRoutes from "./kampanya.js";
import memnuniyetRoutes from "./memnuniyet.js";
import masrafRoutes from "./masraf.js";
import rakipRoutes from "./rakip.js";
import subeRoutes from "./sube.js";
import dssRoutes from "./dssRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import analizlerRoutes from "./analizlerRoutes.js";
import simulasyonRoutes from "./simulasyonRoutes.js";
import nufusYogunluguRoutes from "./nufusYogunlugu.js";
import talepPayiRoutes from "./talepPayi.js";

const router = express.Router();

router.use("/musteri", musteriRoutes);
router.use("/randevu", randevuRoutes);
router.use("/hizmet", hizmetRoutes);
router.use("/ilce", ilceRoutes);
router.use("/kampanya", kampanyaRoutes);
router.use("/memnuniyet", memnuniyetRoutes);
router.use("/masraf", masrafRoutes);
router.use("/rakip", rakipRoutes);
router.use("/sube", subeRoutes);
router.use("/dss", dssRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/analizler", analizlerRoutes);
router.use("/simulasyon", simulasyonRoutes);
router.use("/nufus-yogunlugu", nufusYogunluguRoutes);
router.use("/talep-payi", talepPayiRoutes);

export default router;

