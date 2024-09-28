// testConnection.js
const sequelize = require("./config/database");

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Koneksi ke database berhasil.");
  } catch (error) {
    console.error("Gagal terhubung ke database:", error);
  } finally {
    await sequelize.close();
  }
};

testConnection();
