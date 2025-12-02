const mysql = require("mysql2/promise");
require("dotenv").config();

// Criar pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "cpsl_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// Testar conexão
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexão à base de dados MySQL estabelecida com sucesso!");
    connection.release();
  } catch (error) {
    console.error("❌ Erro ao conectar à base de dados:", error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
