const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");
const {
  upload,
  useSupabase,
  uploadToSupabase,
} = require("../middleware/upload");

// GET - Obter documentos de transparência
router.get("/", async (req, res) => {
  try {
    const { ano, tipo } = req.query;
    let query = "SELECT * FROM transparencia";
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (ano) {
      conditions.push(`ano = $${paramIndex++}`);
      params.push(ano);
    }
    if (tipo) {
      conditions.push(`tipo = $${paramIndex++}`);
      params.push(tipo);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY ano DESC, data_criacao DESC";

    const [documentos] = await pool.query(query, params);
    res.json({ success: true, data: documentos });
  } catch (error) {
    console.error("[transparencia] GET error", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Adicionar documento de transparência
router.post(
  "/",
  [authenticate, isAdminOrGestor, upload.single("ficheiro")],
  async (req, res) => {
    try {
      const { titulo, descricao, ano, tipo } = req.body;

      const allowedTipos = [
        "Relatorio",
        "Contas",
        "Relatorio_Atividades",
        "Outro",
      ];

      const normalizedTipo = tipo === "Relatorio_Contas" ? "Relatorio" : tipo;

      const safeTipo = allowedTipos.includes(normalizedTipo)
        ? normalizedTipo
        : "Relatorio";

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Ficheiro é obrigatório." });
      }

      const path = require("path");
      const filePath = req.file.path || req.file.secure_url || "";

      let ficheiro_url = null;
      if (useSupabase) {
        const uploaded = await uploadToSupabase(req.file);
        ficheiro_url = uploaded?.url;
      } else if (filePath.startsWith("http")) {
        ficheiro_url = filePath;
      } else {
        const folder = path.basename(req.file.destination || "");
        ficheiro_url = `/uploads/${folder ? folder + "/" : ""}${req.file.filename}`;
      }
      const tamanho = req.file.size
        ? (req.file.size / 1024).toFixed(2) + " KB"
        : null;

      const [result] = await pool.query(
        `INSERT INTO transparencia (titulo, descricao, ano, tipo, ficheiro_url, tamanho_ficheiro, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          titulo,
          descricao || null,
          ano,
          safeTipo,
          ficheiro_url,
          tamanho,
          req.user.id,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Documento adicionado com sucesso.",
        data: { id: result[0].id },
      });
    } catch (error) {
      console.error("[transparencia] POST error", error);
      res.status(500).json({
        success: false,
        message: error.message?.includes("invalid input value for enum")
          ? "Tipo inválido. Use Relatorio_Contas, Relatorio_Atividades ou Outro."
          : error.message || "Erro no servidor.",
      });
    }
  },
);

// PUT - Atualizar documento de transparência (metadados e ficheiro opcional)
router.put(
  "/:id",
  [authenticate, isAdminOrGestor, upload.single("ficheiro")],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, descricao, ano, tipo, ordem } = req.body;

      const allowedTipos = [
        "Relatorio",
        "Contas",
        "Relatorio_Atividades",
        "Outro",
      ];

      const normalizedTipo = tipo === "Relatorio_Contas" ? "Relatorio" : tipo;

      const safeTipo = allowedTipos.includes(normalizedTipo)
        ? normalizedTipo
        : "Relatorio";

      // obter registo atual para preservar ficheiro quando não é enviado novo
      const [existingRows] = await pool.query(
        "SELECT ficheiro_url, tamanho_ficheiro FROM transparencia WHERE id = $1",
        [id],
      );
      if (!existingRows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Documento não encontrado." });
      }

      const current = existingRows[0];

      const path = require("path");
      const filePath = req.file?.path || req.file?.secure_url || "";
      let ficheiro_url = current.ficheiro_url;

      if (req.file) {
        if (useSupabase) {
          const uploaded = await uploadToSupabase(req.file);
          ficheiro_url = uploaded?.url;
        } else if (filePath.startsWith("http")) {
          ficheiro_url = filePath;
        } else {
          const folder = path.basename(req.file.destination || "");
          ficheiro_url = `/uploads/${folder ? folder + "/" : ""}${req.file.filename}`;
        }
      }

      const tamanho = req.file
        ? req.file.size
          ? (req.file.size / 1024).toFixed(2) + " KB"
          : current.tamanho_ficheiro
        : current.tamanho_ficheiro;

      await pool.query(
        `UPDATE transparencia
         SET titulo = $1, descricao = $2, ano = $3, tipo = $4, ficheiro_url = $5, tamanho_ficheiro = $6, ordem = COALESCE($7, ordem), data_atualizacao = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [titulo, descricao, ano, safeTipo, ficheiro_url, tamanho, ordem, id],
      );

      res.json({ success: true, message: "Documento atualizado com sucesso." });
    } catch (error) {
      console.error("[transparencia] PUT error", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  },
);

// DELETE - Eliminar documento
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query("DELETE FROM transparencia WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Documento eliminado com sucesso." });
  } catch (error) {
    console.error("[transparencia] DELETE error", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
