const express = require("express");
const router = express.Router();

const db = require("../config/db");

const { authenticate, checkRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

/*
Validation Schemas
*/
const bookSchema = Joi.object({
    doctor_id: Joi.number().integer().required(),
    datetime: Joi.string().required()
});

/*
POST /appointment/book
*/
router.post(
    "/book",
    authenticate,
    checkRole(["patient"]),
    validate(bookSchema),
    (req, res) => {

        const patient_id = req.user.linked_id; // 🔥 SECURE
        const { doctor_id, datetime } = req.body;

        // STEP 1: check availability
        db.query(
            `SELECT * FROM DoctorAvailability 
             WHERE doctor_id = ? AND available_datetime = ? AND is_booked = FALSE`,
            [doctor_id, datetime],
            (err, slots) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                if (slots.length === 0) {
                    return res.status(400).json({ message: "Slot not available" });
                }

                // STEP 2: create consultation
                db.query(
                    `INSERT INTO Consultation (patient_id, doctor_id) VALUES (?, ?)`,
                    [patient_id, doctor_id],
                    (err, consultResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Database error" });
                        }

                        const consult_id = consultResult.insertId;

                        // STEP 3: create appointment
                        db.query(
                            `INSERT INTO Appointment 
                            (consult_id, patient_id, doctor_id, appointment_datetime)
                            VALUES (?, ?, ?, ?)`,
                            [consult_id, patient_id, doctor_id, datetime],
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({ message: "Database error" });
                                }

                                // STEP 4: mark slot booked
                                db.query(
                                    `UPDATE DoctorAvailability 
                                     SET is_booked = TRUE 
                                     WHERE doctor_id = ? AND available_datetime = ?`,
                                    [doctor_id, datetime],
                                    (err) => {
                                        if (err) {
                                            console.error(err);
                                            return res.status(500).json({ message: "Database error" });
                                        }

                                        res.json({ message: "Appointment booked successfully" });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);

/*
DELETE /appointment/:id
*/
router.delete(
    "/:id",
    authenticate,
    checkRole(["patient", "doctor"]),
    (req, res) => {

        const appointment_id = req.params.id;
        const role = req.user.role;
        const user_id = req.user.linked_id;

        // STEP 1: get appointment
        db.query(
            "SELECT * FROM Appointment WHERE appointment_id = ?",
            [appointment_id],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                if (result.length === 0) {
                    return res.status(400).json({ message: "Invalid appointment" });
                }

                const appt = result[0];

                // STEP 2: ownership check
                if (role === "patient" && appt.patient_id != user_id) {
                    return res.status(403).json({ message: "Not authorized" });
                }

                if (role === "doctor" && appt.doctor_id != user_id) {
                    return res.status(403).json({ message: "Not authorized" });
                }

                // STEP 3: delete appointment
                db.query(
                    "DELETE FROM Appointment WHERE appointment_id = ?",
                    [appointment_id],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Database error" });
                        }

                        // STEP 4: free slot
                        db.query(
                            `UPDATE DoctorAvailability 
                             SET is_booked = FALSE 
                             WHERE doctor_id = ? AND available_datetime = ?`,
                            [appt.doctor_id, appt.appointment_datetime]
                        );

                        res.json({ message: "Appointment cancelled" });
                    }
                );
            }
        );
    }
);

module.exports = router;