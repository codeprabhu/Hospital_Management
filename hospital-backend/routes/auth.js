const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/auth");

/*
POST /auth/register
*/
router.post("/register", validate(registerSchema), async (req, res) => {
    const { username, password, role, linked_id } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO User (username, password_hash, role, linked_id) VALUES (?, ?, ?, ?)",
            [username, hashed, role, linked_id || null],
            (err) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({ message: "Username already exists" });
                    }

                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                res.json({ message: "User registered successfully" });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/*
POST /auth/login
*/
router.post("/login", validate(loginSchema), (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM User WHERE username = ?",
        [username],
        async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            if (result.length === 0) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const user = result[0];

            try {
                const isMatch = await bcrypt.compare(password, user.password_hash);

                if (!isMatch) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }

                const token = jwt.sign(
                    {
                        id: user.user_id,
                        role: user.role,
                        linked_id: user.linked_id
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                res.json({
                    message: "Login successful",
                    token
                });

            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
            }
        }
    );
});

module.exports = router;