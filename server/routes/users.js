const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticate, isAdmin } = require("../middleware/auth");

// @route   GET /api/users
// @desc    Obter todos os utilizadores
// @access  Private (Admin)
router.get("/", [authenticate, isAdmin], async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, nome, email, tipo, ativo, data_criacao, 
       (SELECT nome FROM Utilizadores u2 WHERE u2.id = Utilizadores.criado_por) as criado_por_nome
       FROM Utilizadores 
       ORDER BY data_criacao DESC`
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Erro ao obter utilizadores:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

// @route   POST /api/users
// @desc    Criar novo utilizador
// @access  Private (Admin)
router.post(
  "/",
  [
    authenticate,
    isAdmin,
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password deve ter pelo menos 6 caracteres"),
    body("tipo").isIn(["Admin", "Gestor"]).withMessage("Tipo inválido"),
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

      const { nome, email, password, tipo } = req.body;

      // Verificar se email já existe
      const [existing] = await pool.query(
        "SELECT id FROM Utilizadores WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email já está em uso.",
        });
      }

      // Hash da password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Inserir utilizador
      const [result] = await pool.query(
        "INSERT INTO Utilizadores (nome, email, password_hash, tipo, criado_por) VALUES (?, ?, ?, ?, ?)",
        [nome, email, hashedPassword, tipo, req.user.id]
      );

      res.status(201).json({
        success: true,
        message: "Utilizador criado com sucesso.",
        data: {
          id: result.insertId,
          nome,
          email,
          tipo,
        },
      });
    } catch (error) {
      console.error("Erro ao criar utilizador:", error);
      res.status(500).json({
        success: false,
        message: "Erro no servidor.",
      });
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Atualizar utilizador
// @access  Private (Admin)
router.put(
  "/:id",
  [
    authenticate,
    isAdmin,
    body("nome").optional().notEmpty().withMessage("Nome não pode estar vazio"),
    body("email").optional().isEmail().withMessage("Email inválido"),
    body("tipo")
      .optional()
      .isIn(["Admin", "Gestor"])
      .withMessage("Tipo inválido"),
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

      const { id } = req.params;
      const { nome, email, tipo, ativo } = req.body;

      // Verificar se utilizador existe
      const [existing] = await pool.query(
        "SELECT id FROM Utilizadores WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Utilizador não encontrado.",
        });
      }

      // Verificar se email já está em uso por outro utilizador
      if (email) {
        const [emailCheck] = await pool.query(
          "SELECT id FROM Utilizadores WHERE email = ? AND id != ?",
          [email, id]
        );

        if (emailCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Email já está em uso.",
          });
        }
      }

      // Construir query de atualização
      const updates = [];
      const values = [];

      if (nome) {
        updates.push("nome = ?");
        values.push(nome);
      }
      if (email) {
        updates.push("email = ?");
        values.push(email);
      }
      if (tipo) {
        updates.push("tipo = ?");
        values.push(tipo);
      }
      if (typeof ativo !== "undefined") {
        updates.push("ativo = ?");
        values.push(ativo);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nenhum campo para atualizar.",
        });
      }

      values.push(id);

      await pool.query(
        `UPDATE Utilizadores SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      res.json({
        success: true,
        message: "Utilizador atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar utilizador:", error);
      res.status(500).json({
        success: false,
        message: "Erro no servidor.",
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Eliminar utilizador
// @access  Private (Admin)
router.delete("/:id", [authenticate, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir que admin elimine a si próprio
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Não pode eliminar a sua própria conta.",
      });
    }

    // Verificar se utilizador existe
    const [existing] = await pool.query(
      "SELECT id FROM Utilizadores WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilizador não encontrado.",
      });
    }

    // Eliminar utilizador
    await pool.query("DELETE FROM Utilizadores WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Utilizador eliminado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao eliminar utilizador:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

module.exports = router;
