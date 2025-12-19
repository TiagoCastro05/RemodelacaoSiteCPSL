const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// GET - Obter todas as respostas sociais
router.get("/", async (req, res) => {
  try {
    const isAuthenticated = req.headers.authorization;
    let query = "SELECT * FROM respostas_sociais";
    if (!isAuthenticated) query += " WHERE ativo = true";
    query += " ORDER BY ordem ASC";

    const [respostas] = await pool.query(query);
    res.json({ success: true, data: respostas });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET - Obter resposta social por ID
router.get("/:id", async (req, res) => {
  try {
    const [respostas] = await pool.query(
      "SELECT * FROM respostas_sociais WHERE id = $1",
      [req.params.id]
    );
    if (respostas.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Resposta social não encontrada." });
    }

    const [media] = await pool.query(
      "SELECT * FROM media WHERE tabela_referencia = $1 AND id_referencia = $2 ORDER BY ordem ASC",
      ["respostas_sociais", req.params.id]
    );

    res.json({ success: true, data: { ...respostas[0], media } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Criar resposta social
router.post("/", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const {
      titulo,
      subtitulo,
      descricao,
      objetivos,
      servicos_prestados,
      capacidade,
      horario,
      imagem_destaque,
      ativo,
      ordem,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO respostas_sociais (titulo, subtitulo, descricao, objetivos, servicos_prestados, capacidade, horario, imagem_destaque, ativo, ordem, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        titulo,
        subtitulo || null,
        descricao,
        objetivos || null,
        servicos_prestados || null,
        capacidade || null,
        horario || null,
        imagem_destaque || null,
        ativo ?? true,
        ordem || 0,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Resposta social criada com sucesso.",
      data: { id: result[0].id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Atualizar resposta social
router.put("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const fields = [
      "titulo",
      "subtitulo",
      "descricao",
      "objetivos",
      "servicos_prestados",
      "capacidade",
      "horario",
      "imagem_destaque",
      "ativo",
      "ordem",
    ];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum campo para atualizar." });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE respostas_sociais SET ${updates.join(
        ", "
      )} WHERE id = $${paramIndex}`,
      values
    );

    res.json({
      success: true,
      message: "Resposta social atualizada com sucesso.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// DELETE - Eliminar resposta social
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM media WHERE tabela_referencia = $1 AND id_referencia = $2",
      ["respostas_sociais", req.params.id]
    );
    await pool.query("DELETE FROM respostas_sociais WHERE id = $1", [
      req.params.id,
    ]);
    res.json({
      success: true,
      message: "Resposta social eliminada com sucesso.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
