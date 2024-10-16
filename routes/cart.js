// routes/cart.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

const router = express.Router();

// Add to cart
router.post("/add", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;
  console.log(productId);

  try {
    const user = await User.findByPk(req.user.id);
    const product = await Product.findByPk(productId);

    if (!product)
      return res.status(404).json({ message: "Product not found." });

    // Tambahkan atau update cart
    await user.addProduct(product, { through: { quantity: quantity || 1 } });

    res.json({ message: "Product added to cart." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// View cart
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        model: Product,
        through: {
          attributes: ["quantity"],
        },
      },
    });

    res.json({
      data: user.Products,
      message: "Successfully get cart",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// Update cart item
router.put("/update", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    const cartItem = await Cart.findOne({
      where: { UserId: user.id, ProductId: productId },
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ message: "Cart updated." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// Remove from cart
router.delete("/remove/:productId", authMiddleware, async (req, res) => {
  const { productId } = req.params;

  try {
    const user = await User.findByPk(req.user.id);
    const cartItem = await Cart.findOne({
      where: { UserId: user.id, ProductId: productId },
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    await cartItem.destroy();

    res.json({ message: "Product removed from cart." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
