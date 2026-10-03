const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const Food = require("./models/Food");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());
app.use(cors());

// ===============================
// MONGODB CONNECTION
// ===============================
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.log("MongoDB Connection Error:", error.message);
    throw error;
  }
}

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

// ===============================
// AUTH ROUTES
// ===============================
app.use("/api/auth", authRoutes);

// ===============================
// HOME
// ===============================
app.get("/", (req, res) => {
  res.send("FreshTrack Backend is Running!");
});

// ===============================
// ADD FOOD
// ===============================
app.post("/api/foods", async (req, res) => {
  try {
    const food = new Food(req.body);
    const savedFood = await food.save();

    res.status(201).json(savedFood);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// ===============================
// GET ALL FOODS
// ===============================
app.get("/api/foods", async (req, res) => {
  try {
    const foods = await Food.find();

    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// ===============================
// UPDATE FOOD
// ===============================
app.put("/api/foods/:id", async (req, res) => {
  try {
    const updatedFood = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedFood);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// ===============================
// DELETE FOOD
// ===============================
app.delete("/api/foods/:id", async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Food deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// ===============================
// VERCEL EXPORT
// ===============================
module.exports = app;