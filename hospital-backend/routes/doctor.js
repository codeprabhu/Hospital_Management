const express = require("express");
const router = express.Router();

const db = require("../config/db");

const { authenticate, checkRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

/*
Validation Schemas
*/
const prescribeSchema = Joi.object({
    consult_id: Joi.number().integer().required(),
    medicine_id: Joi.number().integer().required(),
    dosage: Joi.string().optional()
});

const availabilitySchema = Joi.object({
    datetime: Joi.string().required()
});

/*
POST /doctor/prescribe
*/
router.post(
    "/prescribe",
    authenticate,
    checkRole(["doctor"]),
    validate(prescribeSchema),
    (req, res) => {

        const { consult_id, medicine_id, dosage } = req.body;
        const doctor_id = req.user.linked_id; // 🔥 FIXED

        // STEP 1: verify doctor owns consultation
        db.query(
            `SELECT * FROM Consultation 
             WHERE consult_id = ? AND doctor_id = ?`,
            [consult_id, doctor_id],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                if (result.length === 0) {
                    return res.status(403).json({ message: "Not your consultation" });
                }

                // STEP 2: insert prescription
                db.query(
                    `INSERT INTO Prescription 
                     (consult_id, doctor_id, medicine_id, dosage)
                     VALUES (?, ?, ?, ?)`,
                    [consult_id, doctor_id, medicine_id, dosage],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Database error" });
                        }

                        res.json({ message: "Prescription added" });
                    }
                );
            }
        );
    }
);

/*
POST /doctor/availability
*/
router.post(
    "/availability",
    authenticate,
    checkRole(["doctor"]),
    validate(availabilitySchema),
    (req, res) => {

        const doctor_id = req.user.linked_id; // 🔥 FIXED
        const { datetime } = req.body;

        db.query(
            "INSERT INTO DoctorAvailability (doctor_id, available_datetime) VALUES (?, ?)",
            [doctor_id, datetime],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                res.json({ message: "Availability added" });
            }
        );
    }
);

module.exports = router;