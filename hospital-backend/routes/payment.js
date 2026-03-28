const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { checkRole } = require("../middleware/auth");

router.post("/pay", checkRole(["patient", "staff", "admin"]), (req, res) => {
    const { bill_id, amount, method } = req.body;

    const role = req.headers.role;
    const user_id = req.headers.user_id;

    if (!bill_id || !amount || !method) {
        return res.status(400).send("Missing fields");
    }

    // STEP 1: check bill
    db.query(
        "SELECT * FROM Bill WHERE bill_id = ?",
        [bill_id],
        (err, billResult) => {
            if (err) return res.status(500).send(err);

            if (billResult.length === 0) {
                return res.status(400).send("Invalid bill");
            }

            const bill = billResult[0];

            // STEP 2: ownership check
            if (role === "patient" && bill.patient_id != user_id) {
                return res.status(403).send("Not authorized");
            }

            // STEP 3: already paid check
            if (bill.status === "paid") {
                return res.status(400).send("Bill already paid");
            }

            // STEP 4: amount validation
            if (parseFloat(amount) !== parseFloat(bill.total_amount)) {
                return res.status(400).send("Incorrect payment amount");
            }

            // STEP 5: insert payment
            db.query(
                "INSERT INTO Payment (bill_id, amount, method) VALUES (?, ?, ?)",
                [bill_id, amount, method],
                (err) => {
                    if (err) return res.status(500).send(err);

                    // STEP 6: update bill status
                    db.query(
                        "UPDATE Bill SET status = 'paid' WHERE bill_id = ?",
                        [bill_id],
                        (err) => {
                            if (err) return res.status(500).send(err);

                            res.json({
                                message: "Payment successful",
                                bill_status: "paid"
                            });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;