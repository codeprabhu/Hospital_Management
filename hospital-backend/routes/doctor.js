const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { checkRole } = require("../middleware/auth");

/*
POST /doctor/prescribe

BODY:
{
  "consult_id": 1,
  "medicine_id": 1,
  "dosage": "2 times a day"
}
*/

router.post("/prescribe", checkRole(["doctor"]), (req, res) => {
    const { consult_id, medicine_id, dosage } = req.body;
    const doctor_id = req.headers.user_id;

    if (!consult_id || !medicine_id) {
        return res.status(400).send("Missing fields");
    }

    //  STEP 1: verify doctor owns consultation
    db.query(
        `SELECT * FROM Consultation 
         WHERE consult_id = ? AND doctor_id = ?`,
        [consult_id, doctor_id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            if (result.length === 0) {
                return res.status(403).send("Not your consultation");
            }

            //  STEP 2: insert prescription
            db.query(
                `INSERT INTO Prescription 
                 (consult_id, doctor_id, medicine_id, dosage)
                 VALUES (?, ?, ?, ?)`,
                [consult_id, doctor_id, medicine_id, dosage],
                (err) => {
                    if (err) return res.status(500).send(err);

                    res.send("Prescription added");
                }
            );
        }
    );
});
router.post("/availability", checkRole(["doctor"]), (req, res) => {
    const doctor_id = req.headers.user_id;
    const { datetime } = req.body;

    if (!datetime) {
        return res.status(400).send("datetime required");
    }

    db.query(
        "INSERT INTO DoctorAvailability (doctor_id, available_datetime) VALUES (?, ?)",
        [doctor_id, datetime],
        (err) => {
            if (err) return res.status(500).send(err);
            res.send("Availability added");
        }
    );
});
module.exports = router;