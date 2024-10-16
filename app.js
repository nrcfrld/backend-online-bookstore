// app.js
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sequelize = require("./config/database");
const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Order = require("./models/Order");

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");

const app = express();

const path = require("path");

// Middleware untuk menyajikan file statis
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Sinkronisasi database dan menjalankan server
sequelize
  .sync({ force: true, alter: true }) // Set ke true untuk reset database setiap start
  .then(() => {
    console.log("Database & tables created!");
    // Tambahkan beberapa produk awal jika diperlukan
    // Contoh:

    // Product.bulkCreate(
    //   [
    //     {
    //       title: "How to Win Friends",
    //       author: "Author A",
    //       price: 100000,
    //       category: "Fiksi",
    //       stock: 10,
    //       thumbnail: "/uploads/default.png",
    //     },
    //     {
    //       title: "Buku B",
    //       author: "Author B",
    //       price: 150000,
    //       category: "Non-Fiksi",
    //       stock: 5,
    //       thumbnail: "/uploads/default.png",
    //     },
    //     {
    //       title: "Buku C",
    //       author: "Author C",
    //       price: 200000,
    //       category: "Teknologi",
    //       stock: 8,
    //       thumbnail: "/uploads/default.png",
    //     },
    //   ],
    //   { ignoreDuplicates: false }
    // )
    //   .then(() => {
    //     console.log("Produk awal telah ditambahkan.");
    //   })
    //   .catch((err) => console.log("Error menambahkan produk awal:", err));

    const PORT = process.env.PORT || 3123;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("Error syncing database:", err));
