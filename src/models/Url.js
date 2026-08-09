const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
        trim: true,
    },

    shortCode: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },

    clicks: {
        type: Number,
        default: 0,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    expiresAt: {
        type: Date,
        default: null,
    },
},
    {
        timestamps: true,
    });

const Url = mongoose.model("Url", urlSchema);

module.exports = Url;