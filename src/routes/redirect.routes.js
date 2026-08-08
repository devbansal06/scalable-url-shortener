const express = require("express");

const router = express.Router();

const { redirectUrl } = require("../controllers/url.controller");

router.get("/:shortCode", redirectUrl);

module.exports = router;