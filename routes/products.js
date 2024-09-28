// routes/products.js
const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // Import middleware upload

const router = express.Router();

// Import Sequelize Op untuk query
const { Op } = require("sequelize");

// Get all products dengan filter dan search
router.get("/", async (req, res) => {
  const { search, category, minPrice, maxPrice } = req.query;
  let where = {};

  if (search) {
    where.title = { [Op.like]: `%${search}%` };
  }

  if (category) {
    where.category = category;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  try {
    const products = await Product.findAll({ where });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// Rute untuk membuat produk baru dengan upload gambar
router.post(
  "/",
  authMiddleware,
  upload.single("thumbnail"),
  async (req, res) => {
    const { title, author, price, description, category, stock } = req.body;
    let thumbnailPath = null;

    if (req.file) {
      thumbnailPath = `/uploads/${req.file.filename}`; // Path relatif
    }

    try {
      const product = await Product.create({
        title,
        author,
        price,
        description,
        category,
        stock,
        thumbnail: thumbnailPath,
      });

      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  }
);

// Rute untuk memperbarui produk dengan upload gambar
router.put(
  "/:id",
  authMiddleware,
  upload.single("thumbnail"),
  async (req, res) => {
    const { id } = req.params;
    const { title, author, price, description, category, stock } = req.body;

    try {
      const product = await Product.findByPk(id);
      if (!product)
        return res.status(404).json({ message: "Product not found." });

      // Update field
      product.title = title || product.title;
      product.author = author || product.author;
      product.price = price || product.price;
      product.description = description || product.description;
      product.category = category || product.category;
      product.stock = stock || product.stock;

      // Update thumbnail jika ada
      if (req.file) {
        product.thumbnail = `/uploads/${req.file.filename}`;
      }

      await product.save();
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Server error.", error: error.message });
    }
  }
);

module.exports = router;
