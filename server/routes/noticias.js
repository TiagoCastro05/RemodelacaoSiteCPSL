const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// GET - Obter todas as notícias/eventos
router.get("/", async (req, res) => {
  try {
    const { tipo, limit, offset } = req.query;
    const isAuthenticated = req.headers.authorization;

    let query = "SELECT * FROM Noticias_Eventos";
    const params = [];
    const conditions = [];

    if (!isAuthenticated) {
      conditions.push("publicado = TRUE");
    }

    if (tipo) {
      conditions.push("tipo = ?");
      params.push(tipo);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY data_publicacao DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit));

      if (offset) {
        query += " OFFSET ?";
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
      "SELECT * FROM Noticias_Eventos WHERE id = ?",
      [req.params.id]
    );

    if (noticias.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notícia não encontrada." });
    }

    const [media] = await pool.query(
      "SELECT * FROM Media WHERE tabela_referencia = ? AND id_referencia = ? ORDER BY ordem ASC",
      ["Noticias_Eventos", req.params.id]
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
      `INSERT INTO Noticias_Eventos (titulo, resumo, conteudo, tipo, autor, imagem_destaque, publicado, data_publicacao, criado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    res
      .status(201)
      .json({
        success: true,
        message: "Notícia criada com sucesso.",
        data: { id: result.insertId },
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

    if (titulo) {
      updates.push("titulo = ?");
      values.push(titulo);
    }
    if (resumo) {
      updates.push("resumo = ?");
      values.push(resumo);
    }
    if (conteudo !== undefined) {
      updates.push("conteudo = ?");
      values.push(conteudo);
    }
    if (tipo) {
      updates.push("tipo = ?");
      values.push(tipo);
    }
    if (imagem_destaque !== undefined) {
      updates.push("imagem_destaque = ?");
      values.push(imagem_destaque);
    }
    if (typeof publicado !== "undefined") {
      updates.push("publicado = ?");
      values.push(publicado);
      if (publicado) {
        updates.push("data_publicacao = ?");
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
      `UPDATE Noticias_Eventos SET ${updates.join(", ")} WHERE id = ?`,
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
      "DELETE FROM Media WHERE tabela_referencia = ? AND id_referencia = ?",
      ["Noticias_Eventos", req.params.id]
    );
    await pool.query("DELETE FROM Noticias_Eventos WHERE id = ?", [
      req.params.id,
    ]);

    res.json({ success: true, message: "Notícia eliminada com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar notícia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
