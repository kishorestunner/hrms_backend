const express = require("express");
const cors = require("cors");
require("dotenv").config();

const employeeRoutes = require("./src/routes/employeeRoutes");
const authRoutes = require("./src/routes/authRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes"); // ✅ ADD THIS

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Running" });
});

// Routes
app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/attendance", attendanceRoutes); // ✅ ADD THIS

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});