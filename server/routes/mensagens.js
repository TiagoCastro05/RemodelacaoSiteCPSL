const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticate, isAdminOrGestor } = require("../middleware/auth");
const nodemailer = require("nodemailer");

// GET - Obter todas as mensagens
router.get("/", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { respondido } = req.query;
    let query = "SELECT * FROM form_contacto";
    const params = [];
    let paramIndex = 1;

    if (respondido !== undefined) {
      query += ` WHERE respondido = $${paramIndex++}`;
      params.push(respondido === "true");
    }

    query += " ORDER BY data_submissao DESC";

    const [mensagens] = await pool.query(query, params);
    res.json({ success: true, data: mensagens });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET - Obter uma mensagem pelo id
router.get("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM form_contacto WHERE id = $1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Mensagem não encontrada." });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Erro ao obter mensagem:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// PUT - Marcar mensagem como lida/respondida (sem enviar resposta)
router.put("/:id/read", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE form_contacto SET respondido = true, data_resposta = NOW(), respondido_por = $1 WHERE id = $2", [req.user.id, id]);
    res.json({ success: true, message: "Mensagem marcada como lida." });
  } catch (error) {
    console.error("Erro ao marcar mensagem como lida:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST - Responder a mensagem
router.post(
  "/:id/responder",
  [authenticate, isAdminOrGestor],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resposta } = req.body;

      if (!resposta) {
        return res
          .status(400)
          .json({ success: false, message: "Resposta é obrigatória." });
      }

      // Obter mensagem original
      const [mensagens] = await pool.query(
        "SELECT * FROM form_contacto WHERE id = $1",
        [id]
      );

      if (mensagens.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Mensagem não encontrada." });
      }

      const mensagem = mensagens[0];

      // Enviar email de resposta
      try {
        const { sendMailSafe } = require('../utils/email');
        const mail = {
          from: process.env.EMAIL_FROM,
          to: mensagem.email,
          subject: `Re: ${mensagem.assunto}`,
          html: `
          <h2>Centro Paroquial e Social de Lanheses</h2>
          <p>Caro(a) ${mensagem.nome},</p>
          <p>${resposta}</p>
          <hr>
          <p><small>Mensagem original:</small></p>
          <p><small>${mensagem.mensagem}</small></p>
          <br>
          <p>Com os melhores cumprimentos,<br>
          Centro Paroquial e Social de Lanheses</p>
        `,
        };

        const result = await sendMailSafe(mail);

        // Atualizar na base de dados mesmo que o email não tenha sido enviado — marca como respondida
        await pool.query(
          "UPDATE form_contacto SET respondido = true, resposta = $1, respondido_por = $2, data_resposta = NOW() WHERE id = $3",
          [resposta, req.user.id, id]
        );

        if (!result.ok) {
          console.warn('Resposta não enviada por email:', result.error && result.error.message ? result.error.message : result.error);
          // return a success response but warn client that email was not delivered
          return res.json({ success: true, message: 'Resposta registada mas não enviada por email (problema SMTP).' });
        }

        res.json({ success: true, message: 'Resposta enviada com sucesso.' });
      } catch (emailError) {
        console.error('Erro ao processar resposta:', emailError);
        // ensure we still inform client but don't crash
        return res.status(500).json({ success: false, message: 'Erro ao processar resposta.' });
      }
    } catch (error) {
      console.error("Erro ao responder mensagem:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// DELETE - Eliminar mensagem
router.delete("/:id", [authenticate, isAdminOrGestor], async (req, res) => {
  try {
    await pool.query("DELETE FROM form_contacto WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Mensagem eliminada com sucesso." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;
