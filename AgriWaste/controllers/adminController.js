const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ==========================
// Admin Login
// ==========================
exports.adminLogin = (req, res) => {
  const { email, password } = req.body;

  pool.query(
    "SELECT * FROM admin_users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).render("adlogin", { msg: "Server error!" });
      }

      if (results.length > 0) {
        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
          // Set admin session
          req.session.adminId = results[0].id;
          req.session.adminEmail = results[0].email;
          
          // ✅ Successful login
          return res.redirect("/admin/dashboard");
        }
      }
      return res.status(401).render("adlogin", { msg: "Invalid credentials!" });
    }
  );
};

// ==========================
// Render Admin Dashboard
// ==========================
// Render Admin Dashboard
// Render Admin Dashboard
// Render Admin Dashboard
// Render Admin Dashboard
exports.renderDashboard = (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/admin/login");
  }

  // Get pending farmer submissions
  pool.query(
    "SELECT * FROM farmers_submission WHERE approval_status='pending'",
    (err, farmers) => {
      if (err) {
        console.error("DB Error (farmers):", err);
        return res.status(500).render("adashboard", {
          farmers: [],
          companies: [],
          error: "Server error loading farmer submissions!"
        });
      }

      // Get pending company submissions with logo URLs
      pool.query(
        `SELECT *, 
          CASE 
            WHEN logo IS NOT NULL THEN CONCAT('/uploads/', logo) 
            ELSE NULL 
          END as logo_url 
         FROM company_submissions 
         WHERE approval_status='pending'`,
        (err, companies) => {
          if (err) {
            console.error("DB Error (companies):", err);
            return res.status(500).render("adashboard", {
              farmers: farmers || [],
              companies: [],
              error: "Server error loading company submissions!"
            });
          }

          // Render HBS with submissions
          res.render("adashboard", {
            farmers: farmers || [],
            companies: companies || [],
            error: null
          });
        }
      );
    }
  );
};
// ==========================
// Farmer Actions
// ==========================
exports.acceptFarmer = (req, res) => {
  const { id } = req.params;

  pool.query(
    "UPDATE farmers_submission SET approval_status='approved' WHERE id=?",
    [id],
    (err) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).render("adashboard", {
          farmers: [],
          companies: [],
          error: "Server error accepting farmer submission!"
        });
      }
      res.redirect("/admin/dashboard");
    }
  );
};

exports.rejectFarmer = (req, res) => {
  const { id } = req.params;

  pool.query("DELETE FROM farmers_submission WHERE id=?", [id], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).render("adashboard", {
        farmers: [],
        companies: [],
        error: "Server error rejecting farmer submission!"
      });
    }
    res.redirect("/admin/dashboard");
  });
};

// ==========================
// Company Actions
// ==========================
exports.acceptCompany = (req, res) => {
  const { id } = req.params;

  pool.query(
    "UPDATE company_submissions SET approval_status='approved' WHERE id=?",
    [id],
    (err) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).render("adashboard", {
          farmers: [],
          companies: [],
          error: "Server error accepting company submission!"
        });
      }
      res.redirect("/admin/dashboard");
    }
  );
};

exports.rejectCompany = (req, res) => {
  const { id } = req.params;

  pool.query("DELETE FROM company_submissions WHERE id=?", [id], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).render("adashboard", {
        farmers: [],
        companies: [],
        error: "Server error rejecting company submission!"
      });
    }
    res.redirect("/admin/dashboard");
  });
};