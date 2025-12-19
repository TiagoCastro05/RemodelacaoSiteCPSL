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
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        await transporter.sendMail({
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
        });

        // Atualizar na base de dados
        await pool.query(
          "UPDATE form_contacto SET respondido = true, resposta = $1, respondido_por = $2, data_resposta = NOW() WHERE id = $3",
          [resposta, req.user.id, id]
        );

        res.json({ success: true, message: "Resposta enviada com sucesso." });
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError);
        return res
          .status(500)
          .json({ success: false, message: "Erro ao enviar email." });
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
