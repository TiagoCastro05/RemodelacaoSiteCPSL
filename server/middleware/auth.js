const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  try {
    // Obter token do header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acesso negado. Token não fornecido.",
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se utilizador existe e está ativo
    const [users] = await pool.query(
      "SELECT id, nome, email, tipo, ativo FROM Utilizadores WHERE id = ? AND ativo = TRUE",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Utilizador não encontrado ou inativo.",
      });
    }

    // Adicionar informações do utilizador ao request
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Erro ao autenticar.",
    });
  }
};

// Middleware para verificar se é Admin
const isAdmin = (req, res, next) => {
  if (req.user.tipo !== "Admin") {
    return res.status(403).json({
      success: false,
      message:
        "Acesso negado. Apenas administradores podem realizar esta ação.",
    });
  }
  next();
};

// Middleware para verificar se é Admin ou Gestor
const isAdminOrGestor = (req, res, next) => {
  if (req.user.tipo !== "Admin" && req.user.tipo !== "Gestor") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado.",
    });
  }
  next();
};

module.exports = { authenticate, isAdmin, isAdminOrGestor };
