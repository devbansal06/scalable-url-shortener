const { nanoid } = require("nanoid");

const Url = require("../models/Url");

const createShortUrl = async (req, res) => {

    try {

        const { originalUrl } = req.body;

        if (!originalUrl) return res.status(400).json({
            success: false,
            message: "Original URL is required",
        });

        const shortCode = nanoid(6);


        const url = await Url.create({
            originalUrl,
            shortCode,
        });

        res.status(201).json({
            success: true,
            message: "Short URL created successfully",
            data: url,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = {createShortUrl};