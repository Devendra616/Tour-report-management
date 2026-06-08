const express = require("express");
const { getMasters } = require("../controllers/masterController");

const router = express.Router();

router.get("/", getMasters);

module.exports = router;
