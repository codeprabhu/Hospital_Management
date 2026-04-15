const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { authenticate, checkRole } = require("../middleware/auth");

/*
GET /prescription/consult/:id

Get all medicines for a consultation
*/

router.get(
    "/consult/:id",
    authenticate,
    checkRole(["doctor", "patient", "staff"]),
    (req, res) => {

        const consult_id = req.params.id;
        const role = req.user.role;
        const user_id = req.user.linked_id;

        // STEP 1: fetch consultation to check ownership
        db.query(
            "SELECT * FROM Consultation WHERE consult_id = ?",
            [consult_id],
            (err, consultResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                if (consultResult.length === 0) {
                    return res.status(400).json({ message: "Invalid consultation" });
                }

                const consult = consultResult[0];

                // STEP 2: enforce ownership for patient
                if (role === "patient" && consult.patient_id != user_id) {
                    return res.status(403).json({ message: "Not authorized" });
                }

                // STEP 3: fetch prescriptions
                db.query(
                    `
                    SELECT 
                        m.name AS medicine,
                        pr.dosage
                    FROM Prescription pr
                    JOIN Medicine m ON pr.medicine_id = m.medicine_id
                    WHERE pr.consult_id = ?
                    `,
                    [consult_id],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Database error" });
                        }

                        res.json({
                            success: true,
                            data: result
                        });
                    }
                );
            }
        );
    }
);

/*
GET /prescription/patient/:id

Get all prescriptions for a patient
*/

router.get(
    "/patient/:id",
    authenticate,
    checkRole(["patient", "doctor", "staff"]),
    (req, res) => {

        const patient_id = req.params.id;
        const role = req.user.role;
        const user_id = req.user.linked_id;

        // STEP 1: enforce ownership for patient
        if (role === "patient" && parseInt(patient_id) !== parseInt(user_id)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // STEP 2: fetch prescriptions
        db.query(
            `
            SELECT 
                c.consult_id,
                m.name AS medicine,
                pr.dosage
            FROM Consultation c
            JOIN Prescription pr ON c.consult_id = pr.consult_id
            JOIN Medicine m ON pr.medicine_id = m.medicine_id
            WHERE c.patient_id = ?
            `,
            [patient_id],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                res.json({
                    success: true,
                    data: result
                });
            }
        );
    }
);

module.exports = router;