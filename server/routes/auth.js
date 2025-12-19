const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticate, isAdmin } = require("../middleware/auth");

// @route   POST /api/auth/login
// @desc    Login de utilizador
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Password é obrigatória"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Verificar se utilizador existe
      const [users] = await pool.query(
        "SELECT * FROM utilizadores WHERE email = $1 AND ativo = true",
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas.",
        });
      }

      const user = users[0];

      // Verificar password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas.",
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          tipo: user.tipo,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo,
        },
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({
        success: false,
        message: "Erro no servidor.",
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Obter utilizador autenticado
// @access  Private
router.get("/me", authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   POST /api/auth/change-password
// @desc    Alterar password
// @access  Private
router.post(
  "/change-password",
  [
    authenticate,
    body("currentPassword")
      .notEmpty()
      .withMessage("Password atual é obrigatória"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Nova password deve ter pelo menos 6 caracteres"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Obter password atual da BD
      const [users] = await pool.query(
        "SELECT password_hash FROM Utilizadores WHERE id = ?",
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Utilizador não encontrado.",
        });
      }

      // Verificar password atual
      const isMatch = await bcrypt.compare(
        currentPassword,
        users[0].password_hash
      );
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Password atual incorreta.",
        });
      }

      // Hash da nova password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Atualizar password
      await pool.query(
        "UPDATE Utilizadores SET password_hash = ? WHERE id = ?",
        [hashedPassword, req.user.id]
      );

      res.json({
        success: true,
        message: "Password alterada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao alterar password:", error);
      res.status(500).json({
        success: false,
        message: "Erro no servidor.",
      });
    }
  }
);

module.exports = router;
