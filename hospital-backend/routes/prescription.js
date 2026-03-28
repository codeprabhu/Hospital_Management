const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { checkRole } = require("../middleware/auth");

/*
GET /prescription/consult/:id

Get all medicines for a consultation
*/

router.get("/consult/:id", checkRole(["doctor", "patient", "staff"]), (req, res) => {
    const consult_id = req.params.id;

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
            if (err) return res.status(500).send(err);
            res.json(result);
        }
    );
});

/*
GET /prescription/patient/:id

Get all prescriptions for a patient
*/

router.get("/patient/:id", checkRole(["patient", "doctor", "staff"]), (req, res) => {
    const patient_id = req.params.id;

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
            if (err) return res.status(500).send(err);
            res.json(result);
        }
    );
});

module.exports = router;