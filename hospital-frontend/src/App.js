import React, { useState, useEffect } from "react";

function App() {
  // ================= PATIENT =================
  const [patients, setPatients] = useState([]);
  const [patientForm, setPatientForm] = useState({
    name: "",
    age: "",
    gender: ""
  });

  const fetchPatients = async () => {
    const res = await fetch("http://127.0.0.1:5000/patient");
    const data = await res.json();
    setPatients(data);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientChange = (e) => {
    setPatientForm({ ...patientForm, [e.target.name]: e.target.value });
  };

  const addPatient = async (e) => {
    e.preventDefault();

    if (!patientForm.name || !patientForm.age || !patientForm.gender) {
      alert("Fill all fields");
      return;
    }

    await fetch("http://127.0.0.1:5000/patient", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patientForm)
    });

    setPatientForm({ name: "", age: "", gender: "" });
    fetchPatients();
  };

  // ================= DOCTOR =================
  const [doctor, setDoctor] = useState({
    name: "",
    phone_no: "",
    dept_id: ""
  });

  const addDoctor = async () => {
    await fetch("http://127.0.0.1:5000/doctor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(doctor)
    });

    alert("Doctor added");
  };

  // ================= APPOINTMENT =================
  const [appointment, setAppointment] = useState({
    patient_id: "",
    doctor_id: "",
    date: ""
  });

  const addAppointment = async () => {
    await fetch("http://127.0.0.1:5000/appointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(appointment)
    });

    alert("Appointment booked");
  };

  // ================= BILL =================
  const [bill, setBill] = useState({
    patient_id: "",
    total_amount: ""
  });

  const createBill = async () => {
    await fetch("http://127.0.0.1:5000/bill/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bill)
    });

    alert("Bill created");
  };

  // ================= AI =================
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");

  const askAI = async () => {
    const res = await fetch("http://127.0.0.1:5000/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    setReply(data.reply);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Hospital Management System</h1>

      {/* ================= PATIENT ================= */}
      <h2>Add Patient</h2>
      <form onSubmit={addPatient}>
        <input
          name="name"
          placeholder="Name"
          value={patientForm.name}
          onChange={handlePatientChange}
        />
        <input
          name="age"
          placeholder="Age"
          value={patientForm.age}
          onChange={handlePatientChange}
        />
        <input
          name="gender"
          placeholder="Gender"
          value={patientForm.gender}
          onChange={handlePatientChange}
        />
        <button type="submit">Add</button>
      </form>

      <h2>Patients List</h2>
      <ul>
        {patients.map((p) => (
          <li key={p.patient_id}>
            {p.name} - {p.age} - {p.gender}
          </li>
        ))}
      </ul>

      {/* ================= DOCTOR ================= */}
      <h2>Add Doctor</h2>
      <input placeholder="Name" onChange={(e) => setDoctor({ ...doctor, name: e.target.value })} />
      <input placeholder="Phone" onChange={(e) => setDoctor({ ...doctor, phone_no: e.target.value })} />
      <input placeholder="Dept ID" onChange={(e) => setDoctor({ ...doctor, dept_id: e.target.value })} />
      <button onClick={addDoctor}>Add Doctor</button>

      {/* ================= APPOINTMENT ================= */}
      <h2>Book Appointment</h2>
      <input placeholder="Patient ID" onChange={(e) => setAppointment({ ...appointment, patient_id: e.target.value })} />
      <input placeholder="Doctor ID" onChange={(e) => setAppointment({ ...appointment, doctor_id: e.target.value })} />
      <input placeholder="Date (YYYY-MM-DD HH:MM:SS)" onChange={(e) => setAppointment({ ...appointment, date: e.target.value })} />
      <button onClick={addAppointment}>Book</button>

      {/* ================= BILL ================= */}
      <h2>Create Bill</h2>
      <input placeholder="Patient ID" onChange={(e) => setBill({ ...bill, patient_id: e.target.value })} />
      <input placeholder="Amount" onChange={(e) => setBill({ ...bill, total_amount: e.target.value })} />
      <button onClick={createBill}>Create Bill</button>

      {/* ================= AI ================= */}
      <h2>AI Assistant </h2>
      <input
        placeholder="Ask something..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={askAI}>Ask</button>
      <p>{reply}</p>
    </div>
  );
}

export default App;