// routes/orders.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const sequelize = require("../config/database");

const router = express.Router();

// Checkout
router.post("/checkout", authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        model: Product,
        through: { attributes: ["quantity"] },
      },
    });

    if (user.Products.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    let total = 0;

    // Hitung total dan cek stok
    for (let product of user.Products) {
      if (product.stock < product.Cart.quantity) {
        throw new Error(`Insufficient stock for ${product.title}.`);
      }
      total += product.price * product.Cart.quantity;
    }

    // Buat order
    const order = await Order.create(
      { UserId: user.id, total },
      { transaction: t }
    );

    // Kurangi stok dan hapus cart
    for (let product of user.Products) {
      product.stock -= product.Cart.quantity;
      await product.save({ transaction: t });
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
});

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
