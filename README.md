# AgriWaste Project

A web application designed to bridge the gap between farmers and companies by facilitating agricultural waste management. Farmers can submit their agricultural waste, and companies can request waste materials, all managed via an Admin dashboard.

## Features
- **Farmer Portal**: Register, login, and submit agricultural waste details.
- **Company Portal**: Register, login, and submit requests for agricultural waste.
- **Admin Dashboard**: Manage and approve/reject farmer and company submissions.
- **Secure Authentication**: Passwords are mathematically hashed and securely verified using `bcryptjs`.
- **Secure Session Management**: Session data is managed via `express-session`.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend Engine**: Handlebars (hbs)
- **Database**: MySQL
- **File Uploads**: Multer
- **Security**: bcryptjs for hashing, dotenv for environment variables

## Prerequisites
- Node.js (v14 or higher recommended)
- MySQL Server

## Setup and Installation

1. **Navigate to the project folder**:
   ```bash
   cd Updated-AgriWaste-Project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Configuration**:
   - Ensure your MySQL server is running.
   - Create a database named `agri` (or as specified in your `.env`).
   - Import your database schema (create the necessary tables for `admin_users`, `farmers`, `farmers_submission`, `companies`, `company_submissions`).

4. **Environment Variables**:
   Create a `.env` file in the root of the project and add the following configuration:
   ```env
   PORT=5000
   DB_PORT=3306
   DATABASE_USER=root
   DATABASE_PASSWORD=your_mysql_password
   DATABASE=agri
   DATABASE_HOST=localhost
   SESSION_SECRET=your_secure_random_secret_string
   ```
   *(Note: The `.env` file is excluded from Git via `.gitignore` to keep credentials secure).*

## Running the Application

To start the application in development mode using nodemon:
```bash
npm start
```

The server will start on `http://localhost:5000`.

## Project Structure
- `/config` - Database configuration and connection pooling.
- `/controllers` - Logic for admin, farmers, companies, and user dashboards.
- `/routes` - Express route definitions.
- `/public` - Static assets (CSS, images, JS).
- `/views` - Handlebars templates (.hbs).
- `/uploads` - Directory for uploaded images and logos.
