// routes/auth.js
const { body, validationResult } = require("express-validator");

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username harus minimal 3 karakter."),
    body("name").notEmpty().withMessage("Name is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password harus minimal 6 karakter."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Hapus file yang diupload jika ada error
      if (req.file) {
        const fs = require("fs");
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json({ errors: errors.array(), message: "Failed register" });
    }

    const { username, name, password } = req.body;

    try {
      // Cek apakah user sudah ada
      let user = await User.findOne({ where: { username } });
      if (user) {
        return res.status(400).json({ message: "User already exists." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Buat user baru
      user = await User.create({ username, name, password: hashedPassword });

      res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username harus minimal 3 karakter."),
    body("password").isString().withMessage("password dibutuhkan"),
  ],
  async (req, res) => {
    const { username, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Hapus file yang diupload jika ada error
      if (req.file) {
        const fs = require("fs");
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json({ errors: errors.array(), message: "Login Failed" });
    }

    try {
      // Cari user
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials." });
      }

      // Cek password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials." });
      }

      // Buat JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ data: { token }, message: "Login success" });
    } catch (error) {
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "name"], // Sertakan 'name'
    });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      data: user,
      message: "Get profile successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

module.exports = router;
