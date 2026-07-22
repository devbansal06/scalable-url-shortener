require("dotenv").config();

const express = require("express");

const connectDB = require("./src/database/connectDB");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/",(req,res)=>{
    res.json({
        success:true,
        message:"Server is Running....."
    });
});

const startServer = async()=>{

   try{
        await connectDB();

        app.listen(PORT, ()=>{
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    }
    catch(error){
        console.error("Failed to start server:", error.message);
    }
};


startServer();