const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();


const hbs = require('hbs');

// Register Handlebars helper for date formatting
hbs.registerHelper('formatDate', function(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Helper for comparing values
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

const index = express();

// ✅ Middlewares
index.use(express.json({ limit: "10mb" }));  
index.use(express.urlencoded({ extended: true, limit: "10mb" }));

index.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// ✅ Static files
index.use(express.static(path.join(__dirname, "public")));
index.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Set view engine
index.set("view engine", "hbs");

// ✅ Routes
index.use("/", require("./routes/pages"));
index.use("/auth", require("./routes/auth"));
index.use("/farmer", require("./routes/farmer"));
index.use('/admin', require('./routes/admin'));
index.use('/company', require('./routes/company'));

// ✅ Start server
const PORT = process.env.PORT || 5000;
index.listen(PORT, () => console.log(`Server running on port ${PORT}`));