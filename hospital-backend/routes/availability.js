const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
GET /availability

Returns all FREE slots with doctor names
*/

router.get("/", (req, res) => {
    db.query(
        `
        SELECT 
            d.doctor_id,
            d.name AS doctor_name,
            da.available_datetime
        FROM DoctorAvailability da
        JOIN Doctor d ON da.doctor_id = d.doctor_id
        WHERE da.is_booked = FALSE
        ORDER BY da.available_datetime
        `,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("DB Error");
            }
            res.json(result);
        }
    );
});

module.exports = router;