const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const dashboardController = require("../controllers/dashboardController");
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'company-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Check if the file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Registration routes
router.get("/register", companyController.showForm);
router.post("/register", companyController.registerCompany);

// Login routes
router.get("/login", companyController.showLoginForm);
router.post("/login", companyController.loginCompany);

// Dashboard route
router.get("/dashboard", (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }
  res.render("cdashboard", { 
    companyName: req.session.companyName,
    error: null,
    success: null
  });
});

// Form submission route with file upload handling
router.post("/dashboard/submit", 
  upload.single('logo'), 
  (err, req, res, next) => {
    // Error handling for file upload
    if (err) {
      return res.render("cdashboard", {
        companyName: req.session.companyName,
        error: err.message,
        success: null
      });
    }
    next();
  },
  dashboardController.submitCompanyForm
);

// Profile route
router.get("/profile", companyController.viewProfile);

// View specific submission
router.get("/submission/:id", companyController.viewSubmission);

// Edit profile page
router.get("/edit", companyController.editProfile);

// Update profile
router.post("/update", companyController.updateProfile);

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/company/login");
  });
});

module.exports = router;