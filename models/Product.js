// models/Product.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define("Product", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: DataTypes.STRING,
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  category: DataTypes.STRING,
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  thumbnail: {
    type: DataTypes.STRING, // Akan menyimpan path atau URL gambar
    allowNull: true,
  },
});

module.exports = Product;
