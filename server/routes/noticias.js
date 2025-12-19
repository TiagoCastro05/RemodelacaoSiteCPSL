const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// GET - Obter todas as notícias/eventos
router.get("/", async (req, res) => {
  try {
    const { tipo, limit, offset } = req.query;
    const isAuthenticated = req.headers.authorization;

    let query = "SELECT * FROM noticias_eventos";
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (!isAuthenticated) {
      conditions.push("publicado = true");
    }

    if (tipo) {
      conditions.push(`tipo = $${paramIndex++}`);
      params.push(tipo);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY data_publicacao DESC";

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(parseInt(limit));

      if (offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(parseInt(offset));
      }
    }

    const [noticias] = await pool.query(query, params);

    res.json({ success: true, data: noticias });
  } catch (error) {
    console.error("Erro ao obter notícias:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET - Obter notícia por ID
router.get("/:id", async (req, res) => {
  try {
    const [noticias] = await pool.query(
      "SELECT * FROM noticias_eventos WHERE id = $1",
      [req.params.id]
    );

    if (noticias.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notícia não encontrada." });
    }

    const [media] = await pool.query(
      "SELECT * FROM media WHERE tabela_referencia = $1 AND id_referencia = $2 ORDER BY ordem ASC",
      ["noticias_eventos", req.params.id]
    );

    res.json({ success: true, data: { ...noticias[0], media } });
  } catch (error) {
    console.error("Erro ao obter notícia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Criar notícia
router.post("/", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { titulo, resumo, conteudo, tipo, imagem_destaque, publicado } =
      req.body;

    const [result] = await pool.query(
      `INSERT INTO noticias_eventos (titulo, resumo, conteudo, tipo, autor, imagem_destaque, publicado, data_publicacao, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        titulo,
        resumo,
        conteudo || null,
        tipo,
        req.user.nome,
        imagem_destaque || null,
        publicado ?? false,
        publicado ? new Date() : null,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Notícia criada com sucesso.",
      data: { id: result[0].id },
    });
  } catch (error) {
    console.error("Erro ao criar notícia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Atualizar notícia
router.put("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { titulo, resumo, conteudo, tipo, imagem_destaque, publicado } =
      req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (titulo) {
      updates.push(`titulo = $${paramIndex++}`);
      values.push(titulo);
    }
    if (resumo) {
      updates.push(`resumo = $${paramIndex++}`);
      values.push(resumo);
    }
    if (conteudo !== undefined) {
      updates.push(`conteudo = $${paramIndex++}`);
      values.push(conteudo);
    }
    if (tipo) {
      updates.push(`tipo = $${paramIndex++}`);
      values.push(tipo);
    }
    if (imagem_destaque !== undefined) {
      updates.push(`imagem_destaque = $${paramIndex++}`);
      values.push(imagem_destaque);
    }
    if (typeof publicado !== "undefined") {
      updates.push(`publicado = $${paramIndex++}`);
      values.push(publicado);
      if (publicado) {
        updates.push(`data_publicacao = $${paramIndex++}`);
        values.push(new Date());
      }
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum campo para atualizar." });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE noticias_eventos SET ${updates.join(
        ", "
      )} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true, message: "Notícia atualizada com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar notícia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// DELETE - Eliminar notícia
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM media WHERE tabela_referencia = $1 AND id_referencia = $2",
      ["noticias_eventos", req.params.id]
    );
    await pool.query("DELETE FROM noticias_eventos WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ success: true, message: "Notícia eliminada com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar notícia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
