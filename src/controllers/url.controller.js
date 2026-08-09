const { nanoid } = require("nanoid");

const Url = require("../models/Url");

const createShortUrl = async (req, res) => {
    try {
        const { originalUrl, expiresAt } = req.body;

        if (!originalUrl) {
            return res.status(400).json({
                success: false,
                message: "Original URL is required",
            });
        }
        let expireDate = null;
        if (expiresAt !== undefined && expiresAt !== null) {

            expireDate = new Date(expiresAt);

            if (Number.isNaN(expireDate.getTime()))
                return res.status(400).json({
                    success: false,
                    message: "Expire date is not in correct format",
                });

            if (expireDate <= new Date())
                return res.status(400).json({
                    success: false,
                    message: "Expire date is less than the current date",
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
                    expiresAt: expireDate,
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

const redirectUrl = async (req, res) => {

    try {
        const { shortCode } = req.params;

        const url = await Url.findOne({
            shortCode
        })

        if (!url) {
            return res.status(404).json({
                success: false,
                message: "Short URL not found",
            });
        }

        if (url.isActive === false) {
            return res.status(410).json({
                success: false,
                message: "URL is inactive",
            });
        }

        if (url.expiresAt && url.expiresAt <= Date.now()) {
            url.isActive = false;
            await url.save();
            return res.status(410).json({
                success: false,
                message: "URL already expired",
            });
        }

        await Url.updateOne(
            { _id: url._id },
            { $inc: { clicks: 1 } }
        );

        return res.redirect(url.originalUrl);
    }
    catch (error) {
        console.error("Redirect error", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }


};

module.exports = { createShortUrl, redirectUrl };