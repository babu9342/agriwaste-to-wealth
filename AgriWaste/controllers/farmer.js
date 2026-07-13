const db = require('../config/db');

// ===== Submit Waste =====
exports.submitWaste = (req, res) => {
  const { name, email, location, waste, farmerPhoto, photo } = req.body || {};

  if (!name || !email || !location || !waste) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  // If logged in, we can use req.session.farmer.id
  const farmerId = req.session?.farmer?.id || null;

  const sql = `
    INSERT INTO farmers_submission
    (farmer_id, name, email, location, waste, farmerPhoto, wastePhoto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [farmerId, name, email, location, waste, farmerPhoto, photo], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    res.json({ msg: "Submission saved successfully!" });
  });
};

// ===== View Profile =====
exports.viewProfile = (req, res) => {
  const farmerId = req.session?.farmer?.id;

  if (!farmerId) {
    return res.render("flogin", { msg: "Please login first!", msg_type: "error" });
  }

  const sql = `
    SELECT * FROM farmers_submission 
    WHERE farmer_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  db.query(sql, [farmerId], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.render("fuserProfile", { msg: "Error loading profile", msg_type: "error" });
    }

    if (result.length === 0) {
      return res.render("fuserProfile", { msg: "No submissions found", msg_type: "info" });
    }

    const submission = result[0];

    // Render HBS and pass submission object
    res.render("fuserProfile", { submission });
  });
};
