const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { checkRole } = require("../middleware/auth");

/*
POST /appointment/book

BODY:
{
  "patient_id": 1,
  "doctor_id": 2,
  "datetime": "2026-04-05 10:00:00"
}
*/

router.post("/book", checkRole(["patient"]), (req, res) => {
    const { patient_id, doctor_id, datetime } = req.body;

    if (!patient_id || !doctor_id || !datetime) {
        return res.status(400).send("Missing fields");
    }

    //  STEP 1: check availability
    db.query(
        `SELECT * FROM DoctorAvailability 
         WHERE doctor_id = ? AND available_datetime = ? AND is_booked = FALSE`,
        [doctor_id, datetime],
        (err, slots) => {
            if (err) return res.status(500).send(err);

            if (slots.length === 0) {
                return res.status(400).send("Slot not available");
            }

            //  STEP 2: create consultation
            db.query(
                `INSERT INTO Consultation (patient_id, doctor_id) VALUES (?, ?)`,
                [patient_id, doctor_id],
                (err, consultResult) => {
                    if (err) return res.status(500).send(err);

                    const consult_id = consultResult.insertId;

                    //  STEP 3: create appointment
                    db.query(
                        `INSERT INTO Appointment 
                        (consult_id, patient_id, doctor_id, appointment_datetime)
                        VALUES (?, ?, ?, ?)`,
                        [consult_id, patient_id, doctor_id, datetime],
                        (err) => {
                            if (err) return res.status(500).send(err);

                            //  STEP 4: mark slot booked
                            db.query(
                                `UPDATE DoctorAvailability 
                                 SET is_booked = TRUE 
                                 WHERE doctor_id = ? AND available_datetime = ?`,
                                [doctor_id, datetime],
                                (err) => {
                                    if (err) return res.status(500).send(err);

                                    res.send("Appointment booked successfully");
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});
router.delete("/:id", checkRole(["patient", "doctor"]), (req, res) => {
    const appointment_id = req.params.id;
    const role = req.headers.role;
    const user_id = req.headers.user_id;

    // get appointment
    db.query(
        "SELECT * FROM Appointment WHERE appointment_id = ?",
        [appointment_id],
        (err, result) => {
            if (err) return res.status(500).send(err);

            if (result.length === 0) {
                return res.status(400).send("Invalid appointment");
            }

            const appt = result[0];

            // ownership check
            if (role === "patient" && appt.patient_id != user_id) {
                return res.status(403).send("Not authorized");
            }

            if (role === "doctor" && appt.doctor_id != user_id) {
                return res.status(403).send("Not authorized");
            }

            // delete appointment
            db.query(
                "DELETE FROM Appointment WHERE appointment_id = ?",
                [appointment_id],
                (err) => {
                    if (err) return res.status(500).send(err);

                    // free slot again
                    db.query(
                        `UPDATE DoctorAvailability 
                         SET is_booked = FALSE 
                         WHERE doctor_id = ? AND available_datetime = ?`,
                        [appt.doctor_id, appt.appointment_datetime]
                    );

                    res.send("Appointment cancelled");
                }
            );
        }
    );
});
module.exports = router;