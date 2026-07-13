const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Login routes
router.get("/login", (req, res) => res.render("adlogin"));
router.post("/login", adminController.adminLogin);

// Dashboard
router.get("/dashboard", adminController.renderDashboard);

// Farmer submissions
router.get("/accept-farmer/:id", adminController.acceptFarmer);
router.get("/reject-farmer/:id", adminController.rejectFarmer);

// Company submissions
router.get("/accept-company/:id", adminController.acceptCompany);
router.get("/reject-company/:id", adminController.rejectCompany);

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/admin/login");
  });
});

module.exports = router;