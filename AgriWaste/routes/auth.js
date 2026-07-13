const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users");

//  Farmer Register 
router.post('/fregister', usersController.fregister);
// Farmer Login 
router.post('/flogin', usersController.flogin);


module.exports = router;
