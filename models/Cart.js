// models/Cart.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");
const Product = require("./Product");

const Cart = sequelize.define("Cart", {
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
});

// Relasi
User.belongsToMany(Product, { through: Cart });
Product.belongsToMany(User, { through: Cart });

module.exports = Cart;
