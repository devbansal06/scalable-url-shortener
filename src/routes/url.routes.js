const express = require("express");

const router = express.Router();

const { createShortUrl, updateUrl, deleteUrl } = require("../controllers/url.controller");

router.post("/", createShortUrl);

router.patch("/:id", updateUrl);

router.delete("/:id", deleteUrl);

module.exports = router;