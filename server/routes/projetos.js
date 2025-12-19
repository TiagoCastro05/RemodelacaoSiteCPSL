const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// @route   GET /api/projetos
// @desc    Obter todos os projetos (públicos: apenas ativos)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const isAuthenticated = req.headers.authorization;

    let query = "SELECT * FROM projetos";
    if (!isAuthenticated) {
      query += " WHERE ativo = true";
    }
    query += " ORDER BY ordem ASC, data_inicio DESC";

    const [projetos] = await pool.query(query);

    res.json({
      success: true,
      data: projetos,
    });
  } catch (error) {
    console.error("Erro ao obter projetos:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

// @route   GET /api/projetos/:id
// @desc    Obter projeto por ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [projetos] = await pool.query(
      "SELECT * FROM projetos WHERE id = $1",
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Projeto não encontrado.",
      });
    }

    // Obter media associada
    const [media] = await pool.query(
      "SELECT * FROM media WHERE tabela_referencia = $1 AND id_referencia = $2 ORDER BY ordem ASC",
      ["projetos", id]
    );

    res.json({
      success: true,
      data: {
        ...projetos[0],
        media,
      },
    });
  } catch (error) {
    console.error("Erro ao obter projeto:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

// @route   POST /api/projetos
// @desc    Criar novo projeto
// @access  Private (Admin/Gestor)
router.post(
  "/",
  [
    authenticate,
    isAdminOrGestor,
    body("titulo").notEmpty().withMessage("Título é obrigatório"),
    body("descricao").notEmpty().withMessage("Descrição é obrigatória"),
    body("data_inicio").isDate().withMessage("Data de início inválida"),
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

      const {
        titulo,
        descricao,
        data_inicio,
        data_fim,
        imagem_destaque,
        url_externa,
        ativo,
        ordem,
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO projetos (titulo, descricao, data_inicio, data_fim, imagem_destaque, url_externa, ativo, ordem, criado_por) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          titulo,
          descricao,
          data_inicio,
          data_fim || null,
          imagem_destaque || null,
          url_externa || null,
          ativo ?? true,
          ordem || 0,
          req.user.id,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Projeto criado com sucesso.",
        data: {
          id: result[0].id,
          titulo,
        },
      });
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro no servidor.",
      });
    }
  }
);

// @route   PUT /api/projetos/:id
// @desc    Atualizar projeto
// @access  Private (Admin/Gestor)
router.put("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      data_inicio,
      data_fim,
      imagem_destaque,
      url_externa,
      ativo,
      ordem,
    } = req.body;

    const [existing] = await pool.query(
      "SELECT id FROM projetos WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Projeto não encontrado.",
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (titulo) {
      updates.push(`titulo = $${paramCount++}`);
      values.push(titulo);
    }
    if (descricao) {
      updates.push(`descricao = $${paramCount++}`);
      values.push(descricao);
    }
    if (data_inicio) {
      updates.push(`data_inicio = $${paramCount++}`);
      values.push(data_inicio);
    }
    if (data_fim !== undefined) {
      updates.push(`data_fim = $${paramCount++}`);
      values.push(data_fim || null);
    }
    if (imagem_destaque !== undefined) {
      updates.push(`imagem_destaque = $${paramCount++}`);
      values.push(imagem_destaque || null);
    }
    if (url_externa !== undefined) {
      updates.push(`url_externa = $${paramCount++}`);
      values.push(url_externa || null);
    }
    if (typeof ativo !== "undefined") {
      updates.push(`ativo = $${paramCount++}`);
      values.push(ativo);
    }
    if (ordem !== undefined) {
      updates.push(`ordem = $${paramCount++}`);
      values.push(ordem);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo para atualizar.",
      });
    }

    values.push(id);

    await pool.query(
      `UPDATE projetos SET ${updates.join(", ")} WHERE id = $${paramCount}`,
      values
    );

    res.json({
      success: true,
      message: "Projeto atualizado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

// @route   DELETE /api/projetos/:id
// @desc    Eliminar projeto
// @access  Private (Admin/Gestor)
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      "SELECT id FROM projetos WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Projeto não encontrado.",
      });
    }

    // Eliminar media associada
    await pool.query(
      "DELETE FROM media WHERE tabela_referencia = $1 AND id_referencia = $2",
      ["projetos", id]
    );

    // Eliminar projeto
    await pool.query("DELETE FROM projetos WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Projeto eliminado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao eliminar projeto:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

module.exports = router;
