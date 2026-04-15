const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { authenticate, checkRole, checkOwnership } = require("../middleware/auth");

/*
GET /patient/:id/dashboard

Returns full patient view
*/

router.get(
  "/:id/dashboard",
  authenticate, // 🔥 REQUIRED
  checkRole(["patient"]),
  checkOwnership("id"),
  (req, res) => {

    const patient_id = req.params.id;

    const query = `
      SELECT 
        p.name AS patient_name,

        d.name AS doctor_name,
        a.appointment_datetime,

        m.name AS medicine,
        pr.dosage,

        b.total_amount

      FROM Patient p

      LEFT JOIN Consultation c ON p.patient_id = c.patient_id
      LEFT JOIN Doctor d ON c.doctor_id = d.doctor_id
      LEFT JOIN Appointment a ON c.consult_id = a.consult_id
      LEFT JOIN Prescription pr ON c.consult_id = pr.consult_id
      LEFT JOIN Medicine m ON pr.medicine_id = m.medicine_id
      LEFT JOIN Bill b ON p.patient_id = b.patient_id

      WHERE p.patient_id = ?
    `;

    db.query(query, [patient_id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        success: true,
        data: result
      });
    });
  }
);

module.exports = router;