const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// GET - Obter conteúdo institucional
router.get("/", async (req, res) => {
  try {
    const { secao } = req.query;
    let query = "SELECT * FROM conteudo_institucional WHERE ativo = true";
    const params = [];

    if (secao) {
      query += " AND secao = $1";
      params.push(secao);
    }

    query += " ORDER BY ordem ASC";

    const [conteudo] = await pool.query(query, params);
    res.json({ success: true, data: conteudo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Atualizar conteúdo institucional
router.put("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { titulo, subtitulo, conteudo, imagem, video_url, ativo } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (titulo !== undefined) {
      updates.push(`titulo = $${paramIndex++}`);
      values.push(titulo);
    }
    if (subtitulo !== undefined) {
      updates.push(`subtitulo = $${paramIndex++}`);
      values.push(subtitulo);
    }
    if (conteudo !== undefined) {
      updates.push(`conteudo = $${paramIndex++}`);
      values.push(conteudo);
    }
    if (imagem !== undefined) {
      updates.push(`imagem = $${paramIndex++}`);
      values.push(imagem);
    }
    if (video_url !== undefined) {
      updates.push(`video_url = $${paramIndex++}`);
      values.push(video_url);
    }
    if (ativo !== undefined) {
      updates.push(`ativo = $${paramIndex++}`);
      values.push(ativo);
    }

    updates.push(`atualizado_por = $${paramIndex++}`);
    values.push(req.user.id);

    if (updates.length === 1) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum campo para atualizar." });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE conteudo_institucional SET ${updates.join(
        ", "
      )} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true, message: "Conteúdo atualizado com sucesso." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
