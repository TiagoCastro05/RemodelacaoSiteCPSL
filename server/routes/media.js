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
      "SELECT * FROM media WHERE tabela_referencia = $1 AND id_referencia = $2 ORDER BY ordem ASC",
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
        const path = require('path');
        const folder = path.basename(req.file.destination || '');
        mediaUrl = `/uploads/${folder}/${req.file.filename}`;
        mimeType = req.file.mimetype;
        tamanho = (req.file.size / 1024).toFixed(2) + " KB";

        if (req.file.mimetype.startsWith("image/")) tipoMedia = "imagem";
        else if (req.file.mimetype.startsWith("video/")) tipoMedia = "video";
        else if (req.file.mimetype === "application/pdf") tipoMedia = "pdf";
      } else if (url) {
        tipoMedia = "link";
      }

      const [result] = await pool.query(
        `INSERT INTO media (tipo, nome, url, descricao, tamanho, mime_type, tabela_referencia, id_referencia, ordem, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
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

      // result[0] may contain insertId (from wrapper) or full row (depending on driver)
      const returnedId = result[0]?.insertId || result[0]?.id || null;
      res.status(201).json({
        success: true,
        message: "Media adicionada com sucesso.",
        data: { id: returnedId, url: mediaUrl },
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
    await pool.query("DELETE FROM media WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Media eliminada com sucesso." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
