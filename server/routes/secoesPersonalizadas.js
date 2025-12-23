const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");

// GET - Obter todas as seções personalizadas ativas
router.get("/", async (req, res) => {
  try {
    const [secoes] = await pool.query(
      "SELECT * FROM secoes_personalizadas WHERE ativo = true ORDER BY ordem ASC"
    );
    res.json({ success: true, data: secoes });
  } catch (error) {
    console.error("Erro ao obter seções:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET - Obter uma seção específica por ID
router.get("/:id", async (req, res) => {
  try {
    const [secoes] = await pool.query(
      "SELECT * FROM secoes_personalizadas WHERE id = $1",
      [req.params.id]
    );

    if (secoes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seção não encontrada.",
      });
    }

    res.json({ success: true, data: secoes[0] });
  } catch (error) {
    console.error("Erro ao obter seção:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET - Obter itens de uma seção específica
router.get("/:id/itens", async (req, res) => {
  try {
    const [itens] = await pool.query(
      "SELECT * FROM itens_secoes_personalizadas WHERE secao_id = $1 AND ativo = true ORDER BY ordem ASC",
      [req.params.id]
    );

    res.json({ success: true, data: itens });
  } catch (error) {
    console.error("Erro ao obter itens:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Criar nova seção personalizada
router.post("/", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const {
      nome,
      titulo,
      slug,
      descricao,
      icone,
      ordem,
      tipo_layout,
      tem_formulario,
      config_formulario,
    } = req.body;

    if (!nome || !titulo || !slug) {
      return res.status(400).json({
        success: false,
        message: "Nome, título e slug são obrigatórios.",
      });
    }

    // Buscar próxima ordem se não fornecida
    let ordemFinal = ordem;
    if (ordemFinal === undefined) {
      const [maxOrdem] = await pool.query(
        "SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM secoes_personalizadas"
      );
      ordemFinal = (maxOrdem[0]?.max_ordem || 0) + 1;
    }

    const [result] = await pool.query(
      `INSERT INTO secoes_personalizadas 
        (nome, titulo, slug, descricao, icone, ordem, tipo_layout, tem_formulario, config_formulario, ativo, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10) 
       RETURNING *`,
      [
        nome,
        titulo,
        slug,
        descricao || null,
        icone || "📄",
        ordemFinal,
        tipo_layout || "cards",
        tem_formulario || false,
        config_formulario ? JSON.stringify(config_formulario) : null,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Seção criada com sucesso.",
      data: result[0],
    });
  } catch (error) {
    console.error("Erro ao criar seção:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: "Já existe uma seção com esse nome ou slug.",
      });
    }
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Adicionar item a uma seção
router.post("/:id/itens", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const secaoId = req.params.id;
    const {
      titulo,
      subtitulo,
      conteudo,
      imagem,
      video_url,
      link_externo,
      ordem,
    } = req.body;

    // Buscar próxima ordem se não fornecida
    let ordemFinal = ordem;
    if (ordemFinal === undefined) {
      const [maxOrdem] = await pool.query(
        "SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM itens_secoes_personalizadas WHERE secao_id = $1",
        [secaoId]
      );
      ordemFinal = (maxOrdem[0]?.max_ordem || 0) + 1;
    }

    const [result] = await pool.query(
      `INSERT INTO itens_secoes_personalizadas 
        (secao_id, titulo, subtitulo, conteudo, imagem, video_url, link_externo, ordem, ativo, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) 
       RETURNING *`,
      [
        secaoId,
        titulo || null,
        subtitulo || null,
        conteudo || null,
        imagem || null,
        video_url || null,
        link_externo || null,
        ordemFinal,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Item adicionado com sucesso.",
      data: result[0],
    });
  } catch (error) {
    console.error("Erro ao adicionar item:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Atualizar seção personalizada
router.put("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const fields = [
      "nome",
      "titulo",
      "slug",
      "descricao",
      "icone",
      "ordem",
      "tipo_layout",
      "tem_formulario",
      "config_formulario",
      "ativo",
    ];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "config_formulario" && req.body[field]) {
          updates.push(`${field} = $${paramIndex++}`);
          values.push(JSON.stringify(req.body[field]));
        } else {
          updates.push(`${field} = $${paramIndex++}`);
          values.push(req.body[field]);
        }
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo para atualizar.",
      });
    }

    updates.push(`data_atualizacao = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    await pool.query(
      `UPDATE secoes_personalizadas SET ${updates.join(
        ", "
      )} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true, message: "Seção atualizada com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar seção:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Atualizar item de seção
router.put(
  "/:secaoId/itens/:itemId",
  [authenticate, isAdminOrGestor],
  async (req, res) => {
    try {
      const fields = [
        "titulo",
        "subtitulo",
        "conteudo",
        "imagem",
        "video_url",
        "link_externo",
        "ordem",
        "ativo",
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
        return res.status(400).json({
          success: false,
          message: "Nenhum campo para atualizar.",
        });
      }

      updates.push(`data_atualizacao = CURRENT_TIMESTAMP`);
      values.push(req.params.itemId);

      await pool.query(
        `UPDATE itens_secoes_personalizadas SET ${updates.join(
          ", "
        )} WHERE id = $${paramIndex}`,
        values
      );

      res.json({ success: true, message: "Item atualizado com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// DELETE - Eliminar seção (soft delete)
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query(
      "UPDATE secoes_personalizadas SET ativo = false WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true, message: "Seção eliminada com sucesso." });
  } catch (error) {
    console.error("Erro ao eliminar seção:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// DELETE - Eliminar item de seção (soft delete)
router.delete(
  "/:secaoId/itens/:itemId",
  [authenticate, isAdminOrGestor],
  async (req, res) => {
    try {
      await pool.query(
        "UPDATE itens_secoes_personalizadas SET ativo = false WHERE id = $1",
        [req.params.itemId]
      );
      res.json({ success: true, message: "Item eliminado com sucesso." });
    } catch (error) {
      console.error("Erro ao eliminar item:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

module.exports = router;
