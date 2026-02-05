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

// POST - Criar novo conteúdo institucional
router.post("/", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    console.log("POST /conteudo - Body recebido:", req.body);
    console.log("POST /conteudo - User:", req.user);

    const {
      titulo,
      texto,
      conteudo,
      resumo,
      secao = "instituicao",
      imagem_url,
      imagem_destaque,
      video_url,
      destaques,
    } = req.body;

    // Suportar tanto 'texto' quanto 'conteudo'
    const conteudoFinal = conteudo || texto;

    // Suportar tanto 'imagem_url' quanto 'imagem_destaque'
    const imagemFinal = imagem_destaque || imagem_url;

    console.log("Validação - titulo:", titulo, "conteudoFinal:", conteudoFinal);

    if (!titulo || !conteudoFinal) {
      console.log("Validação FALHOU - retornando 400");
      return res.status(400).json({
        success: false,
        message: "Título e conteúdo são obrigatórios.",
      });
    }

    // Buscar próxima ordem
    const [maxOrdem] = await pool.query(
      "SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM conteudo_institucional WHERE secao = $1",
      [secao],
    );
    const ordem = (maxOrdem[0]?.max_ordem || 0) + 1;

    const [result] = await pool.query(
      `INSERT INTO conteudo_institucional 
        (secao, titulo, subtitulo, conteudo, imagem, video_url, destaques, ordem, ativo, criado_por, atualizado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10) 
       RETURNING *`,
      [
        secao,
        titulo,
        resumo || "",
        conteudoFinal,
        imagemFinal || null,
        video_url || null,
        destaques || null,
        ordem,
        req.user.id,
        req.user.id,
      ],
    );

    res.json({
      success: true,
      message: "Conteúdo criado com sucesso.",
      data: result[0],
    });
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// DELETE - Eliminar conteúdo institucional
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query(
      "UPDATE conteudo_institucional SET ativo = false WHERE id = $1",
      [req.params.id],
    );
    res.json({ success: true, message: "Conteúdo eliminado com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar conteúdo:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Atualizar conteúdo institucional
router.put("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const {
      titulo,
      texto,
      subtitulo,
      conteudo,
      imagem,
      imagem_url,
      video_url,
      destaques,
      ativo,
    } = req.body;
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
    // Suportar tanto 'conteudo' quanto 'texto'
    if (conteudo !== undefined) {
      updates.push(`conteudo = $${paramIndex++}`);
      values.push(conteudo);
    } else if (texto !== undefined) {
      updates.push(`conteudo = $${paramIndex++}`);
      values.push(texto);
    }
    if (imagem !== undefined) {
      updates.push(`imagem = $${paramIndex++}`);
      values.push(imagem);
    }
    if (imagem_url !== undefined) {
      updates.push(`imagem = $${paramIndex++}`);
      values.push(imagem_url);
    }
    if (video_url !== undefined) {
      updates.push(`video_url = $${paramIndex++}`);
      values.push(video_url);
    }
    if (destaques !== undefined) {
      updates.push(`destaques = $${paramIndex++}`);
      values.push(destaques);
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
    const [result] = await pool.query(
      `UPDATE conteudo_institucional SET ${updates.join(
        ", ",
      )} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    res.json({
      success: true,
      message: "Conteúdo atualizado com sucesso.",
      data: result[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar conteúdo:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
