const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { checkRole } = require("../middleware/auth");

/*
POST /admission/assign

BODY:
{
  "patient_id": 1,
  "room_no": 101
}
*/

router.post("/assign", checkRole(["doctor", "staff"]), (req, res) => {
    const { patient_id, room_no } = req.body;

    if (!patient_id || !room_no) {
        return res.status(400).send("Missing fields");
    }

    // STEP 1: check patient not already admitted
    db.query(
        "SELECT * FROM Admission WHERE patient_id = ? AND discharge_date IS NULL",
        [patient_id],
        (err, patientResult) => {
            if (err) return res.status(500).send(err);

            if (patientResult.length > 0) {
                return res.status(400).send("Patient already admitted");
            }

            // STEP 2: check room not occupied
            db.query(
                "SELECT * FROM Admission WHERE room_no = ? AND discharge_date IS NULL",
                [room_no],
                (err, roomResult) => {
                    if (err) return res.status(500).send(err);

                    if (roomResult.length > 0) {
                        return res.status(400).send("Room already occupied");
                    }

                    // STEP 3: assign
                    db.query(
                        "INSERT INTO Admission (patient_id, room_no) VALUES (?, ?)",
                        [patient_id, room_no],
                        (err) => {
                            if (err) return res.status(500).send(err);

                            res.send("Patient admitted successfully");
                        }
                    );
                }
            );
        }
    );
});
router.post("/discharge", checkRole(["doctor", "staff"]), (req, res) => {
    const { patient_id } = req.body;

    db.query(
        "UPDATE Admission SET discharge_date = NOW() WHERE patient_id = ? AND discharge_date IS NULL",
        [patient_id],
        (err) => {
            if (err) return res.status(500).send(err);

            res.send("Patient discharged");
        }
    );
});
module.exports = router;