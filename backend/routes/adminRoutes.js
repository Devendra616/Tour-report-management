const express = require("express");
const { login, verify } = require("../controllers/adminController");
const { verifyAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.get("/verify", verifyAdmin, verify);

module.exports = router;
