require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const todoRoutes = require("./routes/todoRoutes");

const app = express();
app.use(express.json());

// Log every API request: method, url, status, time taken, and body for writes
app.use("/api", (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const body = ["POST", "PUT"].includes(req.method)
      ? ` ${JSON.stringify(req.body)}`
      : "";
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms${body}`
    );
  });
  next();
});

// API routes
app.use("/api/todos", todoRoutes);

// Serve the React build (used in production)
const buildPath = path.join(__dirname, "../client/dist");
app.use(express.static(buildPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5001;

const startServer = () => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      startServer();
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
} else {
  console.warn("MONGO_URI not set; using in-memory todos for local development.");
  startServer();
}
