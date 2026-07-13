const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.render("index"));

// Farmer pages
router.get("/flogin", (req, res) => res.render("flogin"));
router.get("/fregister", (req, res) => res.render("fregister"));
router.get("/fdashboard", (req, res) => res.render("fdashboard"));
router.get("/fuserProfile", (req, res) => res.render("fuserProfile"));

// Company pages
router.get("/clogin", (req, res) => res.render("clogin"));
router.get("/cregister", (req, res) => res.render("cregister"));
router.get("/cdashboard", (req, res) => res.render("cdashboard"));
router.get("/companyprofile", (req, res) => res.render("companyprofile"));

// Admin pages
router.get("/adlogin", (req, res) => res.render("adlogin"));
router.get("/adashboard", (req, res) => res.render("adashboard"));

module.exports = router;
