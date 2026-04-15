const express = require("express");
const cors = require("cors");

const db = require("./config/db"); 

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/auth", require("./routes/auth"));
app.use("/appointment", require("./routes/appointment"));
app.use("/availability", require("./routes/availability"));
app.use("/patient", require("./routes/patient"));
app.use("/doctor", require("./routes/doctor"));
app.use("/admission", require("./routes/admission"));
app.use("/bill", require("./routes/bill"));
app.use("/payment", require("./routes/payment"));
app.use("/prescription", require("./routes/prescription"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong");
});