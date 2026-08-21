require("dotenv").config();

const express = require("express");

const connectDB = require("./src/database/connectDB");

const urlRoutes = require("./src/routes/url.routes");

const redirectRoutes = require("./src/routes/redirect.routes");

const expireUrls = require("./src/jobs/expireUrls");

const { redisClient, connectRedis } = require("./src/database/connectRedis");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/v1/urls", urlRoutes);

app.use("/", redirectRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Server is Running....."
    });
});

const startServer = async () => {

    try {
        await connectDB();

        try {
            await connectRedis();
        } catch (error) {
            console.error("Redis unavailable. Continuing without Redis.");
        }


        // const redisConnected = await connectRedis();

        // if (!redisConnected) {
        //     console.log("⚠️ Redis unavailable. Running without Redis.");
        // }

        // for testing testing only
        // await redisClient.set("test:key","hello redis");
        // const value = await redisClient.get("test:key");
        // console.log("Redis test value", value);

        expireUrls();

        setInterval(expireUrls, 60 * 1000);

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });

    }
    catch (error) {
        console.error("Failed to start server:", error.message);
    }
};


startServer();