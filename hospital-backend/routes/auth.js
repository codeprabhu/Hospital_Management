const express = require("express");
const router = express.Router();

/*
POST /auth/login

Body:
{
  "username": "doctor",
  "password": "Doctor@123"
}
*/

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "Admin@123") {
        return res.json({ role: "admin", user_id: 1 });
    }

    if (username === "doctor" && password === "Doctor@123") {
        return res.json({ role: "doctor", user_id: 2 });
    }

    if (username === "staff" && password === "Staff@123") {
        return res.json({ role: "staff", user_id: 3 });
    }

    if (username === "patient" && password === "Patient@123") {
        return res.json({ role: "patient", user_id: 4 });
    }

    res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;