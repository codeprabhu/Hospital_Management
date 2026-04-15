const express = require("express");
const router = express.Router();

const db = require("../config/db");

const { authenticate, checkRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");

/*
Validation Schema
*/
const paymentSchema = Joi.object({
    bill_id: Joi.number().integer().required(),
    amount: Joi.number().required(),
    method: Joi.string().required()
});

/*
POST /payment/pay
*/
router.post(
    "/pay",
    authenticate,
    checkRole(["patient", "staff", "admin"]),
    validate(paymentSchema),
    (req, res) => {

        const { bill_id, amount, method } = req.body;
        const role = req.user.role;
        const user_id = req.user.linked_id;

        // STEP 1: check bill
        db.query(
            "SELECT * FROM Bill WHERE bill_id = ?",
            [bill_id],
            (err, billResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                }

                if (billResult.length === 0) {
                    return res.status(400).json({ message: "Invalid bill" });
                }

                const bill = billResult[0];

                // STEP 2: ownership check (only patient restricted)
                if (role === "patient" && bill.patient_id != user_id) {
                    return res.status(403).json({ message: "Not authorized" });
                }

                // STEP 3: already paid check
                if (bill.status === "paid") {
                    return res.status(400).json({ message: "Bill already paid" });
                }

                // STEP 4: amount validation
                if (parseFloat(amount) !== parseFloat(bill.total_amount)) {
                    return res.status(400).json({ message: "Incorrect payment amount" });
                }

                // STEP 5: insert payment
                db.query(
                    "INSERT INTO Payment (bill_id, amount, method) VALUES (?, ?, ?)",
                    [bill_id, amount, method],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Database error" });
                        }

                        // STEP 6: update bill status
                        db.query(
                            "UPDATE Bill SET status = 'paid' WHERE bill_id = ?",
                            [bill_id],
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({ message: "Database error" });
                                }

                                res.json({
                                    success: true,
                                    message: "Payment successful",
                                    bill_status: "paid"
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

module.exports = router;