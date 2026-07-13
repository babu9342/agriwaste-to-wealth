const pool = require('../config/db');
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

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// ==========================
// Render Dashboard Page
// ==========================
exports.renderDashboard = (req, res) => {
  // Check if company is logged in
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  // Check for success message from redirect
  let success = null;
  if (req.query.success) {
    success = "Company details submitted successfully!";
  }

  res.render("cdashboard", {
    companyName: req.session.companyName,
    error: null,
    success: success
  });
};

// ==========================
// Handle Company Form Submission
// ==========================
// Handle dashboard form submission with file upload
exports.submitCompanyForm = (req, res) => {
  // Check if company is logged in
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  console.log("=== FORM SUBMISSION STARTED ===");
  console.log("Request body:", req.body);
  console.log("Uploaded file:", req.file);

  const { name, Email, Address, Quantity, requirement } = req.body;
  const companyId = req.session.companyId;
  const companyName = req.session.companyName;
  
  // Store the logo filename (not the full path)
  const logoFilename = req.file ? req.file.filename : null;

  console.log("Extracted values:", {
    name, Email, Address, Quantity, requirement, 
    companyId, companyName, logoFilename
  });

  // Validate required fields
  if (!name || !Email || !Address || !Quantity || !requirement) {
    console.log("Validation failed - missing fields");
    const missingFields = [];
    if (!name) missingFields.push("Company Name");
    if (!Email) missingFields.push("Email");
    if (!Address) missingFields.push("Address");
    if (!Quantity) missingFields.push("Quantity");
    if (!requirement) missingFields.push("Requirements");
    
    return res.render("cdashboard", {
      error: `Please fill in all required fields. Missing: ${missingFields.join(', ')}`,
      companyName: companyName,
      success: null
    });
  }

  const sql = `
    INSERT INTO company_submissions 
    (company_id, company_name, email, address, quantity, requirements, logo, approval_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const queryParams = [companyId, name, Email, Address, Quantity, requirement, logoFilename];

  console.log("Executing SQL:", sql);
  console.log("With parameters:", queryParams);

  pool.query(
    sql,
    queryParams,
    (err, result) => {
      if (err) {
        console.error("Database insert error:", err);
        
        let errorMessage = "An error occurred. Please try again.";
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
          errorMessage = "Company not found. Please log in again.";
        } else if (err.code === 'ER_DATA_TOO_LONG') {
          errorMessage = "One or more fields are too long. Please shorten your inputs.";
        }
        
        return res.render("cdashboard", {
          error: errorMessage,
          companyName: companyName,
          success: null
        });
      }

      console.log("Company submission inserted successfully! ID:", result.insertId);
      
      // Redirect to profile page with success message
      res.redirect("/company/profile?success=true");
    }
  );
};

// ==========================
// Get Submission History
// ==========================
exports.getSubmissionHistory = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const companyId = req.session.companyId;
  const companyName = req.session.companyName;

  const sql = `
    SELECT * FROM company_submissions 
    WHERE company_id = ? 
    ORDER BY submitted_at DESC
  `;

  console.log("Fetching submission history for company:", companyId);

  pool.query(sql, [companyId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.render("submissionHistory", {
        companyName: companyName,
        error: "Error retrieving submission history",
        submissions: []
      });
    }

    console.log(`Found ${results.length} submissions for company ${companyId}`);
    
    res.render("submissionHistory", {
      companyName: companyName,
      error: null,
      submissions: results
    });
  });
};

// ==========================
// Get Single Submission
// ==========================
exports.getSubmission = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const submissionId = req.params.id;
  const companyId = req.session.companyId;
  const companyName = req.session.companyName;

  const sql = `
    SELECT * FROM company_submissions 
    WHERE id = ? AND company_id = ?
  `;

  console.log("Fetching submission:", submissionId, "for company:", companyId);

  pool.query(sql, [submissionId, companyId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.render("submissionDetails", {
        companyName: companyName,
        error: "Error retrieving submission details",
        submission: null
      });
    }

    if (results.length === 0) {
      console.log("Submission not found:", submissionId);
      return res.render("submissionDetails", {
        companyName: companyName,
        error: "Submission not found or you don't have permission to view it",
        submission: null
      });
    }

    console.log("Submission found:", results[0]);
    
    res.render("submissionDetails", {
      companyName: companyName,
      error: null,
      submission: results[0]
    });
  });
};

// ==========================
// Update Submission
// ==========================
exports.updateSubmission = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const submissionId = req.params.id;
  const companyId = req.session.companyId;
  const companyName = req.session.companyName;
  const { name, Email, Address, Quantity, requirement } = req.body;
  const logoPath = req.file ? req.file.filename : null;

  console.log("Updating submission:", submissionId);

  // Validate required fields
  if (!name || !Email || !Address || !Quantity || !requirement) {
    console.log("Update validation failed - missing fields");
    return res.render("cdashboard", {
      error: "Please fill in all required fields.",
      companyName: companyName,
      success: null
    });
  }

  // Build update query based on whether a new logo was uploaded
  let sql, queryParams;
  if (logoPath) {
    sql = `
      UPDATE company_submissions 
      SET company_name = ?, email = ?, address = ?, quantity = ?, requirements = ?, logo = ?
      WHERE id = ? AND company_id = ?
    `;
    queryParams = [name, Email, Address, Quantity, requirement, logoPath, submissionId, companyId];
  } else {
    sql = `
      UPDATE company_submissions 
      SET company_name = ?, email = ?, address = ?, quantity = ?, requirements = ?
      WHERE id = ? AND company_id = ?
    `;
    queryParams = [name, Email, Address, Quantity, requirement, submissionId, companyId];
  }

  console.log("Executing update SQL:", sql);
  console.log("With parameters:", queryParams);

  pool.query(sql, queryParams, (err, result) => {
    if (err) {
      console.error("Database update error:", err);
      return res.render("submissionDetails", {
        companyName: companyName,
        error: "Error updating submission",
        submission: null
      });
    }

    if (result.affectedRows === 0) {
      console.log("No rows affected - submission not found");
      return res.render("submissionDetails", {
        companyName: companyName,
        error: "Submission not found or you don't have permission to edit it",
        submission: null
      });
    }

    console.log("Submission updated successfully. Affected rows:", result.affectedRows);
    
    res.redirect("/company/dashboard/history?updated=true");
  });
};

// ==========================
// Delete Submission
// ==========================
exports.deleteSubmission = (req, res) => {
  if (!req.session.companyId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const submissionId = req.params.id;
  const companyId = req.session.companyId;

  console.log("Deleting submission:", submissionId);

  const sql = "DELETE FROM company_submissions WHERE id = ? AND company_id = ?";

  pool.query(sql, [submissionId, companyId], (err, result) => {
    if (err) {
      console.error("Database delete error:", err);
      return res.status(500).json({ error: "Error deleting submission" });
    }

    if (result.affectedRows === 0) {
      console.log("No rows affected - submission not found");
      return res.status(404).json({ error: "Submission not found" });
    }

    console.log("Submission deleted successfully. Affected rows:", result.affectedRows);
    
    res.json({ success: true, message: "Submission deleted successfully" });
  });
};

// ==========================
// Check Submission Status
// ==========================
exports.checkSubmissionStatus = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const companyId = req.session.companyId;
  const companyName = req.session.companyName;

  const sql = `
    SELECT approval_status, COUNT(*) as count 
    FROM company_submissions 
    WHERE company_id = ? 
    GROUP BY approval_status
  `;

  console.log("Checking submission status for company:", companyId);

  pool.query(sql, [companyId], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Error checking submission status" });
    }

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    results.forEach(row => {
      statusCounts[row.approval_status] = row.count;
    });

    console.log("Status counts:", statusCounts);
    
    res.json({
      companyName: companyName,
      statusCounts: statusCounts,
      total: results.reduce((sum, row) => sum + parseInt(row.count), 0)
    });
  });
};

// ==========================
// Middleware for File Upload Errors
// ==========================
exports.handleUploadError = (err, req, res, next) => {
  console.error("File upload error:", err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.render("cdashboard", {
        companyName: req.session.companyName,
        error: "File too large. Maximum size is 5MB.",
        success: null
      });
    }
  } else if (err) {
    return res.render("cdashboard", {
      companyName: req.session.companyName,
      error: err.message,
      success: null
    });
  }
  next();
};

// ==========================
// Debug Route - Check Database Connection
// ==========================
exports.checkDatabase = (req, res) => {
  pool.query("SELECT 1 + 1 AS solution", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ database: "Connected", solution: results[0].solution });
  });
};

// ==========================
// Debug Route - Check Table Structure
// ==========================
exports.checkTableStructure = (req, res) => {
  pool.query("DESCRIBE company_submissions", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ tableStructure: results });
  });
};

// ==========================
// Debug Route - View All Submissions
// ==========================
exports.viewAllSubmissions = (req, res) => {
  pool.query("SELECT * FROM company_submissions", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ submissions: results });
  });
};