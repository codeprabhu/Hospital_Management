const express = require("express");
const cors = require("cors");

const db = require("./config/db"); 

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/appointment", require("./routes/appointment"));
app.use("/availability", require("./routes/availability"));
app.use("/patient", require("./routes/patient"));
app.use("/doctor", require("./routes/doctor"));
app.use("/admission", require("./routes/admission"));
app.use("/bill", require("./routes/bill"));
app.use("/payment", require("./routes/payment"));
app.use("/prescription", require("./routes/prescription"));

// test routes
app.get("/test-db", (req, res) => {
    db.query("SELECT * FROM Patient", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("DB Error");
        }
        res.json(result);
    });
});

app.post("/test-add", (req, res) => {
    const { name, age, gender } = req.body;

    db.query(
        "INSERT INTO Patient (name, age, gender) VALUES (?, ?, ?)",
        [name, age, gender],
        (err) => {
            if (err) return res.status(500).send(err);
            res.send("Inserted");
        }
    );
});

app.get("/", (req, res) => {
    res.send("Backend running");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong");
});