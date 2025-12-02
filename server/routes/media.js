const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");
const upload = require("../middleware/upload");

// GET - Obter media por referência
router.get("/", async (req, res) => {
  try {
    const { tabela_referencia, id_referencia } = req.query;

    if (!tabela_referencia || !id_referencia) {
      return res
        .status(400)
        .json({ success: false, message: "Parâmetros inválidos." });
    }

    const [media] = await pool.query(
      "SELECT * FROM Media WHERE tabela_referencia = ? AND id_referencia = ? ORDER BY ordem ASC",
      [tabela_referencia, id_referencia]
    );

    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Upload de media
router.post(
  "/",
  [authenticate, isAdminOrGestor, upload.single("file")],
  async (req, res) => {
    try {
      const {
        nome,
        descricao,
        tabela_referencia,
        id_referencia,
        ordem,
        tipo,
        url,
      } = req.body;

      let mediaUrl = url;
      let mimeType = null;
      let tamanho = null;
      let tipoMedia = tipo;

      if (req.file) {
        mediaUrl = `/uploads/${req.file.filename}`;
        mimeType = req.file.mimetype;
        tamanho = (req.file.size / 1024).toFixed(2) + " KB";

        if (req.file.mimetype.startsWith("image/")) tipoMedia = "imagem";
        else if (req.file.mimetype.startsWith("video/")) tipoMedia = "video";
        else if (req.file.mimetype === "application/pdf") tipoMedia = "pdf";
      } else if (url) {
        tipoMedia = "link";
      }

      const [result] = await pool.query(
        `INSERT INTO Media (tipo, nome, url, descricao, tamanho, mime_type, tabela_referencia, id_referencia, ordem, criado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tipoMedia,
          nome,
          mediaUrl,
          descricao || null,
          tamanho,
          mimeType,
          tabela_referencia,
          id_referencia,
          ordem || 0,
          req.user.id,
        ]
      );

      res
        .status(201)
        .json({
          success: true,
          message: "Media adicionada com sucesso.",
          data: { id: result.insertId, url: mediaUrl },
        });
    } catch (error) {
      console.error("Erro ao adicionar media:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// DELETE - Eliminar media
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query("DELETE FROM Media WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Media eliminada com sucesso." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
