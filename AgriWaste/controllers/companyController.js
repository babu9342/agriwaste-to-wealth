const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ==========================
// Show Registration Form
// ==========================
exports.showForm = (req, res) => {
  res.render("cregister", { 
    error: null,
    companyName: '',
    location: '',
    email: ''
  });
};

// ==========================
// Register New Company
// ==========================
exports.registerCompany = async (req, res) => {
  const { companyName, location, email, password, confirmPassword } = req.body;

  // Validate required fields
  if (!companyName || !location || !email || !password || !confirmPassword) {
    return res.render("cregister", {
      error: "All fields are required",
      companyName: companyName || '',
      location: location || '',
      email: email || ''
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("cregister", {
      error: "Please enter a valid email address",
      companyName: companyName,
      location: location,
      email: email
    });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.render("cregister", {
      error: "Passwords do not match",
      companyName: companyName,
      location: location,
      email: email
    });
  }

  // Check password strength
  if (password.length < 6) {
    return res.render("cregister", {
      error: "Password must be at least 6 characters long",
      companyName: companyName,
      location: location,
      email: email
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = `INSERT INTO companies (company_name, location, email, password) VALUES (?, ?, ?, ?)`;

  pool.query(sql, [companyName, location, email, hashedPassword], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      
      let errorMessage = "Database error. Please try again.";
      if (err.code === "ER_DUP_ENTRY") {
        errorMessage = "Email already registered. Please use a different email.";
      }
      
      return res.render("cregister", {
        error: errorMessage,
        companyName: companyName,
        location: location,
        email: email
      });
    }

    console.log("Company registered with ID:", result.insertId);
    
    // Redirect to login with success message
    res.render("clogin", { 
      error: null,
      success: "Registration successful! Please login.",
      email: email
    });
  });
};

// ==========================
// Show Login Form
// ==========================
exports.showLoginForm = (req, res) => {
  res.render("clogin", { 
    error: null,
    success: null,
    email: ''
  });
};

// ==========================
// Company Login
// ==========================
exports.loginCompany = (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.render("clogin", {
      error: "Please enter both email and password",
      success: null,
      email: email || ''
    });
  }

  const sql = "SELECT * FROM companies WHERE email = ?";

  pool.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.render("clogin", {
        error: "Database error. Please try again.",
        success: null,
        email: email
      });
    }

    if (results.length === 0) {
      return res.render("clogin", {
        error: "Email not registered. Please register first.",
        success: null,
        email: email
      });
    }

    const company = results[0];

    const match = await bcrypt.compare(password, company.password);
    if (!match) {
      return res.render("clogin", {
        error: "Incorrect password. Please try again.",
        success: null,
        email: email
      });
    }

    // Store session info
    req.session.companyId = company.id;
    req.session.companyName = company.company_name;
    req.session.companyEmail = company.email;

    console.log("Company logged in:", company.company_name);
    
    // Redirect to dashboard
    res.redirect("/company/dashboard");
  });
};

// ==========================
// View Company Profile
// ==========================
// View Company Profile
exports.viewProfile = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const companyId = req.session.companyId;
  const companyName = req.session.companyName;

  // Check for success message from query parameter
  const success = req.query.success ? "Company details submitted successfully!" : null;

  // Get company details
  const companySql = "SELECT * FROM companies WHERE id = ?";
  
  pool.query(companySql, [companyId], (err, companyResults) => {
    if (err) {
      console.error("Error fetching company details:", err);
      return res.render("companyprofile", {
        error: "Error loading company details",
        company: null,
        submissions: [],
        companyName: companyName,
        success: null
      });
    }

    // Get company submissions with proper logo URLs
    const submissionSql = `
      SELECT *, 
        CASE 
          WHEN logo IS NOT NULL THEN CONCAT('/uploads/', logo) 
          ELSE NULL 
        END as logo_url 
      FROM company_submissions 
      WHERE company_id = ? 
      ORDER BY submitted_at DESC
    `;

    pool.query(submissionSql, [companyId], (err, submissionResults) => {
      if (err) {
        console.error("Error fetching submissions:", err);
        return res.render("companyprofile", {
          error: "Error loading submissions",
          company: companyResults[0] || null,
          submissions: [],
          companyName: companyName,
          success: success
        });
      }

      res.render("companyprofile", {
        error: null,
        company: companyResults[0] || null,
        submissions: submissionResults,
        companyName: companyName,
        success: success
      });
    });
  });
};
// ==========================
// View Specific Submission
// ==========================
exports.viewSubmission = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const { id } = req.params;
  const companyId = req.session.companyId;
  const companyName = req.session.companyName;

  const sql = "SELECT * FROM company_submissions WHERE id = ? AND company_id = ?";

  pool.query(sql, [id, companyId], (err, results) => {
    if (err) {
      console.error("Error fetching submission:", err);
      return res.render("submissionDetails", {
        error: "Error loading submission details",
        submission: null,
        companyName: companyName
      });
    }

    if (results.length === 0) {
      return res.render("submissionDetails", {
        error: "Submission not found or you don't have permission to view it",
        submission: null,
        companyName: companyName
      });
    }

    res.render("submissionDetails", {
      error: null,
      submission: results[0],
      companyName: companyName
    });
  });
};

// ==========================
// Edit Company Profile Form
// ==========================
exports.editProfile = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const companyId = req.session.companyId;
  const companyName = req.session.companyName;

  const sql = "SELECT * FROM companies WHERE id = ?";

  pool.query(sql, [companyId], (err, results) => {
    if (err) {
      console.error("Error fetching company details:", err);
      return res.render("editCompany", {
        error: "Error loading company details",
        company: null,
        companyName: companyName
      });
    }

    if (results.length === 0) {
      return res.render("editCompany", {
        error: "Company not found",
        company: null,
        companyName: companyName
      });
    }

    res.render("editCompany", {
      error: null,
      company: results[0],
      companyName: companyName
    });
  });
};

// ==========================
// Update Company Profile
// ==========================
exports.updateProfile = (req, res) => {
  if (!req.session.companyId) {
    return res.redirect("/company/login");
  }

  const companyId = req.session.companyId;
  const companyName = req.session.companyName;
  const { company_name, location, email, currentPassword, newPassword, confirmPassword } = req.body;

  // Validate required fields
  if (!company_name || !location || !email) {
    return res.render("editCompany", {
      error: "Company name, location, and email are required",
      company: { id: companyId, company_name, location, email },
      companyName: companyName
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("editCompany", {
      error: "Please enter a valid email address",
      company: { id: companyId, company_name, location, email },
      companyName: companyName
    });
  }

  // Check if password change is requested
  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render("editCompany", {
        error: "All password fields are required to change password",
        company: { id: companyId, company_name, location, email },
        companyName: companyName
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("editCompany", {
        error: "New passwords do not match",
        company: { id: companyId, company_name, location, email },
        companyName: companyName
      });
    }

    if (newPassword.length < 6) {
      return res.render("editCompany", {
        error: "New password must be at least 6 characters long",
        company: { id: companyId, company_name, location, email },
        companyName: companyName
      });
    }

    // Verify current password
    const verifySql = "SELECT password FROM companies WHERE id = ?";
    pool.query(verifySql, [companyId], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.render("editCompany", {
          error: "Error verifying current password",
          company: { id: companyId, company_name, location, email },
          companyName: companyName
        });
      }

      if (results.length === 0) {
        return res.render("editCompany", {
          error: "Current password is incorrect",
          company: { id: companyId, company_name, location, email },
          companyName: companyName
        });
      }

      const match = await bcrypt.compare(currentPassword, results[0].password);
      if (!match) {
        return res.render("editCompany", {
          error: "Current password is incorrect",
          company: { id: companyId, company_name, location, email },
          companyName: companyName
        });
      }

      // Update with password change
      updateCompanyWithPassword();
    });
  } else {
    // Update without password change
    updateCompanyWithoutPassword();
  }

  async function updateCompanyWithPassword() {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = "UPDATE companies SET company_name = ?, location = ?, email = ?, password = ? WHERE id = ?";
    pool.query(sql, [company_name, location, email, hashedPassword, companyId], (err, result) => {
      handleUpdateResult(err, result);
    });
  }

  function updateCompanyWithoutPassword() {
    const sql = "UPDATE companies SET company_name = ?, location = ?, email = ? WHERE id = ?";
    pool.query(sql, [company_name, location, email, companyId], (err, result) => {
      handleUpdateResult(err, result);
    });
  }

  function handleUpdateResult(err, result) {
    if (err) {
      console.error("Error updating company:", err);
      
      let errorMessage = "Error updating company details";
      if (err.code === "ER_DUP_ENTRY") {
        errorMessage = "Email already exists. Please use a different email.";
      }
      
      return res.render("editCompany", {
        error: errorMessage,
        company: { id: companyId, company_name, location, email },
        companyName: companyName
      });
    }

    if (result.affectedRows === 0) {
      return res.render("editCompany", {
        error: "Company not found",
        company: { id: companyId, company_name, location, email },
        companyName: companyName
      });
    }

    // Update session with new company name
    req.session.companyName = company_name;
    
    res.redirect("/company/profile?updated=true");
  }
};

// ==========================
// Company Logout
// ==========================
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/company/login");
  });
};

// ==========================
// Get Company Dashboard Data
// ==========================
exports.getDashboardData = (req, res) => {
  if (!req.session.companyId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const companyId = req.session.companyId;

  // Get submission counts by status
  const statusSql = `
    SELECT approval_status, COUNT(*) as count 
    FROM company_submissions 
    WHERE company_id = ? 
    GROUP BY approval_status
  `;

  pool.query(statusSql, [companyId], (err, statusResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Error fetching dashboard data" });
    }

    // Get recent submissions
    const recentSql = `
      SELECT * FROM company_submissions 
      WHERE company_id = ? 
      ORDER BY submitted_at DESC 
      LIMIT 5
    `;

    pool.query(recentSql, [companyId], (err, recentResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Error fetching recent submissions" });
      }

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0
      };

      statusResults.forEach(row => {
        statusCounts[row.approval_status] = row.count;
      });

      res.json({
        statusCounts: statusCounts,
        recentSubmissions: recentResults,
        totalSubmissions: statusResults.reduce((sum, row) => sum + parseInt(row.count), 0)
      });
    });
  });
};