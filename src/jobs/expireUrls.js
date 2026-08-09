const Url = require("../models/Url");

const expireUrls = async () => {
    try {
        const result = await Url.updateMany(
            {
                expiresAt: { $lte: new Date() },
                isActive: true,
            },
            {
                $set: {
                    isActive: false,
                },
            }
        );

        console.log(`Expired URLs updated: ${result.modifiedCount}`);
    } catch (error) {
        console.error("Error expiring URLs:", error);
    }
};

module.exports = expireUrls;