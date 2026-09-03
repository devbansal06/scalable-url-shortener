const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // 2. Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // 3. Check if user already exists
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with mail already exist",
            });
        }

        // 4. Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // 5. Create user
        try {
            await User.create({
                name,
                email: normalizedEmail,
                passwordHash,
            });
        } catch (error) {
            if (error.code == 11000) {
                return res.status(409).json({
                    success: false,
                    message: "User with this email already exists",
                });
            }

            throw error;
        }


        // 6. Return safe response
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                name,
                email: normalizedEmail,
            },
        });


    } catch (error) {
        console.error("Register user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // 2. Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // 3. Find user
        const user = await User.findOne({
            email: normalizedEmail,
        })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 4. Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );
        if (isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 5. Generate JWT
        const token = jwt.sign({
            userId :user._id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"1d",
        }
    );

        // 6. Return token
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
            },
        });

    } catch (error) {
        console.error("Login user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

module.exports = { registerUser , loginUser};