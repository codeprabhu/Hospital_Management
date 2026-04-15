const express = require("express");
const router = express.Router();

const db = require("../config/db");

const { authenticate, checkRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

/*
Validation Schemas
*/
const assignSchema = Joi.object({
    patient_id: Joi.number().integer().required(),
    room_no: Joi.number().integer().required()
});

const dischargeSchema = Joi.object({
    patient_id: Joi.number().integer().required()
});

/*
POST /admission/assign
*/
router.post(
    "/assign",
    authenticate,
    checkRole(["doctor", "staff"]),
    validate(assignSchema),
    (req, res) => {

        const { patient_id, room_no } = req.body;

        // STEP 1: check patient not already admitted
        db.query(
            "SELECT * FROM Admission WHERE patient_id = ? AND discharge_date IS NULL",
            [patient_id],
            (err, patientResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                if (patientResult.length > 0) {
                    return res.status(400).json({ message: "Patient already admitted" });
                }

                // STEP 2: check room not occupied
                db.query(
                    "SELECT * FROM Admission WHERE room_no = ? AND discharge_date IS NULL",
                    [room_no],
                    (err, roomResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Database error" });
                        }

                        if (roomResult.length > 0) {
                            return res.status(400).json({ message: "Room already occupied" });
                        }

                        // STEP 3: assign
                        db.query(
                            "INSERT INTO Admission (patient_id, room_no) VALUES (?, ?)",
                            [patient_id, room_no],
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({ message: "Database error" });
                                }

                                res.json({ message: "Patient admitted successfully" });
                            }
                        );
                    }
                );
            }
        );
    }
);

/*
POST /admission/discharge
*/
router.post(
    "/discharge",
    authenticate,
    checkRole(["doctor", "staff"]),
    validate(dischargeSchema),
    (req, res) => {

        const { patient_id } = req.body;

        db.query(
            "UPDATE Admission SET discharge_date = NOW() WHERE patient_id = ? AND discharge_date IS NULL",
            [patient_id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                res.json({ message: "Patient discharged" });
            }
        );
    }
);

module.exports = router;