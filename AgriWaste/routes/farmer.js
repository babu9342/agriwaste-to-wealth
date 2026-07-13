const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmer");

// Show Dashboard Form
router.get("/dashboard", (req, res) => res.render("fdashboard"));

// Save submission to DB
router.post("/submit", farmerController.submitWaste);

// Show Profile (latest submission)
router.get("/profile", farmerController.viewProfile);

module.exports = router;
