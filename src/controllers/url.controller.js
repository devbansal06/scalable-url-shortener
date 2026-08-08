const { nanoid } = require("nanoid");

const Url = require("../models/Url");

const createShortUrl = async (req, res) => {
    try {
        const { originalUrl } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                success: false,
                message: "Original URL is required",
            });
        }

        try {
            const url = new URL(originalUrl);

            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return res.status(400).json({
                    success: false,
                    message: "Only HTTP and HTTPS URLs are supported",
                });
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid URL",
            });
        }

        let url;

        while (!url) {
            const shortCode = nanoid(6);

            try {
                url = await Url.create({
                    originalUrl,
                    shortCode,
                });
            } catch (error) {
                if (error.code === 11000) {
                    continue;
                }

                throw error;
            }
        }

        return res.status(201).json({
            success: true,
            message: "Short URL created successfully",
            data: url,
        });

    } catch (error) {
        console.error("Create short URL error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};