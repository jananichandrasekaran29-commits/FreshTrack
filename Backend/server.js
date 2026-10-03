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

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB Connected Successfully!");
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;

    console.log("MongoDB Connection Error:", error.message);

    throw error;
  }

  return cached.conn;
}

// ===============================
// CONNECT TO MONGODB
// BEFORE HANDLING REQUESTS
// ===============================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
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
      message: error.message,
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
      message: error.message,
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
      message: error.message,
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
      message: "Food deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ===============================
// VERCEL EXPORT
// ===============================

module.exports = app;