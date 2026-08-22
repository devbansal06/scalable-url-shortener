const express = require("express");

const router = express.Router();

const { createShortUrl, updateUrl } = require("../controllers/url.controller");

router.post("/", createShortUrl);

router.patch("/:id",updateUrl);

module.exports = router;