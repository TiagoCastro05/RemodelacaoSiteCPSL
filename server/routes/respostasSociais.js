const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// GET - Obter todas as respostas sociais
router.get("/", async (req, res) => {
  try {
    const isAuthenticated = req.headers.authorization;
    let query = "SELECT * FROM Respostas_Sociais";
    if (!isAuthenticated) query += " WHERE ativo = TRUE";
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
      "SELECT * FROM Respostas_Sociais WHERE id = ?",
      [req.params.id]
    );
    if (respostas.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Resposta social não encontrada." });
    }

    const [media] = await pool.query(
      "SELECT * FROM Media WHERE tabela_referencia = ? AND id_referencia = ? ORDER BY ordem ASC",
      ["Respostas_Sociais", req.params.id]
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
      `INSERT INTO Respostas_Sociais (titulo, subtitulo, descricao, objetivos, servicos_prestados, capacidade, horario, imagem_destaque, ativo, ordem, criado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    res
      .status(201)
      .json({
        success: true,
        message: "Resposta social criada com sucesso.",
        data: { id: result.insertId },
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

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
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
      `UPDATE Respostas_Sociais SET ${updates.join(", ")} WHERE id = ?`,
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
      "DELETE FROM Media WHERE tabela_referencia = ? AND id_referencia = ?",
      ["Respostas_Sociais", req.params.id]
    );
    await pool.query("DELETE FROM Respostas_Sociais WHERE id = ?", [
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
