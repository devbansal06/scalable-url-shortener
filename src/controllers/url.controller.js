const { nanoid } = require("nanoid");

const Url = require("../models/Url");

const { redisClient } = require("../database/connectRedis");

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

        const cacheKey = `url:${shortCode}`;

        // 1. Check Redis
        let cachedData = null;

        try {
            cachedData = await redisClient.get(cacheKey);
        }
        catch (error) {
            console.error("Redis SET falied", error.message);
        }

        // 2. Cache HIT
        if (cachedData) {
            const cachedUrl = JSON.parse(cachedData);

            if (cachedUrl.isActive === false) {
                await redisClient.del(cacheKey);

                return res.status(410).json({
                    success: false,
                    message: "URL is inActive",
                });
            }

            if (
                cachedUrl.expiresAt &&
                new Date(cachedUrl.expiresAt) <= new Date()
            ) {
                await redisClient.del(cacheKey);

                return res.status(410).json({
                    success: false,
                    message: "URL has expired",
                });
            }

            await Url.updateOne(
                { shortCode },
                { $inc: { clicks: 1 } }
            );

            return res.redirect(cachedUrl.originalUrl);
        }

        // 3. Cache MISS → MongoDB
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

        const cacheData = {
            originalUrl: url.originalUrl,
            isActive: url.isActive,
            expiresAt: url.expiresAt,
        };

        if (url.expiresAt) {
            const ttlSeconds = Math.floor(
                (url.expiresAt.getTime() - Date.now()) / 1000
            );

            if (ttlSeconds > 0) {
                try {
                    await redisClient.set(
                        cacheKey,
                        JSON.stringify(cacheData),
                        {
                            EX: ttlSeconds,
                        }
                    );
                } catch (error) {
                    console.error("Redis SET failed:", error.message);
                }
            }
        } else {
            await redisClient.set(
                cacheKey,
                JSON.stringify(cacheData)
            );
        }

        // 5. Increment clicks atomically
        await Url.updateOne(
            { _id: url._id },
            { $inc: { clicks: 1 } }
        );

        // 6. Redirect
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


const updateUrl = async (req, res) => {

    try {
        const { id } = req.params;

        const url = await Url.findById(id);

        if (!url) {
            return res.status(404).json({
                success: false,
                message: "Url not found",
            });
        }

        const { originalUrl, expiresAt, isActive } = req.body;

        const updates = {};


        //originalUrl
        if (originalUrl !== undefined) {
            try {
                const newurl = new URL(originalUrl);

                if (newurl.protocol !== "http:" && newurl.protocol !== "https:") {
                    return res.status(400).json({
                        success: false,
                        message: "Only HTTP and HTTPS URLs are supported",
                    });
                }

                updates.originalUrl = originalUrl;

            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid URL",
                });
            }
        }


        //expiresAt
        if (expiresAt !== undefined) {
            if (expiresAt === null) {
                updates.expiresAt = null;
            }
            else {
                const expireDate = new Date(expiresAt);

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

                updates.expiresAt = expireDate;
            }
        }


        //isActive
        if (isActive!==undefined) {
            if(typeof isActive !=="boolean"){
                return res.status(400).json({
                    success: false,
                    message: "isActive must be a boolean",
                });
            }

            updates.isActive = isActive;
        }


        // Nothing to update
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }


        await Url.updateOne(
            {_id:id},
            {$set:updates}
        );


        // Invalidate Redis cache
        try {
            await redisClient.del(`url:${url.shortCode}`);
        } catch (error) {
            console.error("Redis DEL failed:", error.message);
        }


        const updatedUrl = await Url.findById(id);

        return res.status(200).json({
            success: true,
            message: "URL updated successfully",
            data: updatedUrl,
        });
        
    }
    catch (error) {
        console.error("Update URL error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
module.exports = { createShortUrl, redirectUrl , updateUrl};