const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { checkRole } = require("../middleware/auth");

// cost constants
const CONSULTATION_FEE = 500;
const MEDICINE_COST = 100;
const ROOM_COST = 1000;

/*
POST /bill/generate

BODY:
{
  "consult_id": 1
}
*/

router.post("/generate", checkRole(["staff", "admin"]), (req, res) => {
    const { consult_id } = req.body;

    if (!consult_id) {
        return res.status(400).send("consult_id required");
    }

    // STEP 1: get consultation info
    db.query(
        "SELECT * FROM Consultation WHERE consult_id = ?",
        [consult_id],
        (err, consultResult) => {
            if (err) return res.status(500).send(err);

            if (consultResult.length === 0) {
                return res.status(400).send("Invalid consultation");
            }

            const consult = consultResult[0];
            const patient_id = consult.patient_id;
            const doctor_id = consult.doctor_id;

            let total = 0;

            // STEP 2: add consultation fee
            total += CONSULTATION_FEE;

            // STEP 3: count medicines
            db.query(
                "SELECT COUNT(*) AS count FROM Prescription WHERE consult_id = ?",
                [consult_id],
                (err, medResult) => {
                    if (err) return res.status(500).send(err);

                    const medCount = medResult[0].count;
                    total += medCount * MEDICINE_COST;

                    // STEP 4: check if patient admitted
                    db.query(
                        "SELECT * FROM Admission WHERE patient_id = ? AND discharge_date IS NULL",
                        [patient_id],
                        (err, admissionResult) => {
                            if (err) return res.status(500).send(err);

                            let admission_id = null;

                            if (admissionResult.length > 0) {
                                admission_id = admissionResult[0].admission_id;
                                total += ROOM_COST;
                            }

                            // STEP 5: insert bill
                            db.query(
                                `INSERT INTO Bill 
                                (patient_id, doctor_id, consult_id, admission_id, total_amount)
                                VALUES (?, ?, ?, ?, ?)`,
                                [patient_id, doctor_id, consult_id, admission_id, total],
                                (err) => {
                                    if (err) return res.status(500).send(err);

                                    res.json({
                                        message: "Bill generated successfully",
                                        total_amount: total
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;