// routes/orders.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const sequelize = require("../config/database");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Checkout dengan spesifik produk
router.post(
  "/checkout",
  authMiddleware,
  [
    body("products")
      .isArray({ min: 1 })
      .withMessage("Products must be a non-empty array."),
    body("products.*.productId")
      .isInt({ gt: 0 })
      .withMessage("Product ID must be a positive integer."),
    body("products.*.quantity")
      .isInt({ gt: 0 })
      .withMessage("Quantity must be a positive integer."),
  ],
  async (req, res) => {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { products } = req.body;

    const t = await sequelize.transaction();
    try {
      // Ambil user beserta cart yang relevan
      const user = await User.findByPk(req.user.id, {
        include: {
          model: Product,
          through: { attributes: ["quantity"] },
        },
        transaction: t,
      });

      if (!user) {
        throw new Error("User not found.");
      }

      // Filter produk yang ingin di-checkout berdasarkan request
      const checkoutProducts = user.Products.filter((product) =>
        products.some((p) => p.productId === product.id)
      );

      if (checkoutProducts.length === 0) {
        throw new Error("No valid products found in cart for checkout.");
      }

      let total = 0;

      // Validasi stok dan hitung total
      for (let product of checkoutProducts) {
        const requestedQuantity = products.find(
          (p) => p.productId === product.id
        ).quantity;

        if (product.stock < requestedQuantity) {
          throw new Error(
            `Insufficient stock for ${product.title}. Requested: ${requestedQuantity}, Available: ${product.stock}`
          );
        }

        total += product.price * requestedQuantity;
      }

      // Buat order baru
      const order = await Order.create(
        { UserId: user.id, total },
        { transaction: t }
      );

      // Proses pengurangan stok dan penghapusan item dari cart
      for (let product of checkoutProducts) {
        const requestedQuantity = products.find(
          (p) => p.productId === product.id
        ).quantity;

        // Kurangi stok
        product.stock -= requestedQuantity;
        await product.save({ transaction: t });

        // Hapus dari cart
        await Cart.destroy({
          where: { UserId: user.id, ProductId: product.id },
          transaction: t,
        });
      }

      await t.commit();
      res.json({ message: "Checkout successful.", orderId: order.id });
    } catch (error) {
      await t.rollback();
      res.status(400).json({ message: error.message });
    }
  }
);

// Get user orders
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { UserId: req.user.id } });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
