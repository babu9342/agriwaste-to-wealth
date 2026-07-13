const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// GET dashboard page
router.get("/", dashboardController.renderDashboard);

// POST company form submission
router.post("/submit", dashboardController.submitCompanyForm);

module.exports = router;
