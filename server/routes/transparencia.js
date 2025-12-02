const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");
const upload = require("../middleware/upload");

// GET - Obter documentos de transparência
router.get("/", async (req, res) => {
  try {
    const { ano, tipo } = req.query;
    let query = "SELECT * FROM Transparencia";
    const params = [];
    const conditions = [];

    if (ano) {
      conditions.push("ano = ?");
      params.push(ano);
    }
    if (tipo) {
      conditions.push("tipo = ?");
      params.push(tipo);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY ano DESC, data_criacao DESC";

    const [documentos] = await pool.query(query, params);
    res.json({ success: true, data: documentos });
  } catch (error) {
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

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Ficheiro é obrigatório." });
      }

      const ficheiro_url = `/uploads/${req.file.filename}`;
      const tamanho = (req.file.size / 1024).toFixed(2) + " KB";

      const [result] = await pool.query(
        `INSERT INTO Transparencia (titulo, descricao, ano, tipo, ficheiro_url, tamanho_ficheiro, criado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          titulo,
          descricao || null,
          ano,
          tipo || "Relatorio_Contas",
          ficheiro_url,
          tamanho,
          req.user.id,
        ]
      );

      res
        .status(201)
        .json({
          success: true,
          message: "Documento adicionado com sucesso.",
          data: { id: result.insertId },
        });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// DELETE - Eliminar documento
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query("DELETE FROM Transparencia WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Documento eliminado com sucesso." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
