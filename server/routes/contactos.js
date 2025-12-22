const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const nodemailer = require("nodemailer");

// @route   GET /api/contactos
// @desc    Obter todos os contactos
// @access  Public
router.get("/", async (req, res) => {
  try {
    const [contactos] = await pool.query(
      "SELECT * FROM contactos_institucionais WHERE ativo = true ORDER BY ordem ASC"
    );

    res.json({
      success: true,
      data: contactos,
    });
  } catch (error) {
    console.error("Erro ao obter contactos:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor.",
    });
  }
});

// @route   POST /api/contactos/form
// @desc    Enviar formulário de contacto
// @access  Public
router.post(
  "/form",
  [
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("email").isEmail().withMessage("Email inválido"),
    body("assunto").notEmpty().withMessage("Assunto é obrigatório"),
    body("mensagem").notEmpty().withMessage("Mensagem é obrigatória"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { nome, email, assunto, mensagem } = req.body;

      // log for debugging duplicate submissions
      console.log('[contactos] new submission:', { nome, email, assunto });

      // Prevent duplicate submissions: if an identical message was submitted in the last 60 seconds, ignore
      try {
        const checkSql = `SELECT COUNT(*) as cnt FROM form_contacto WHERE nome = $1 AND email = $2 AND assunto = $3 AND mensagem = $4 AND data_submissao >= NOW() - INTERVAL '60 seconds'`;
        const [rows] = await pool.query(checkSql, [nome, email, assunto, mensagem]);
        const cnt = parseInt(rows[0]?.cnt || rows.cnt || 0, 10);
        if (cnt > 0) {
          console.warn('[contactos] duplicate submission detected within 60s - ignoring insert');
          return res.status(200).json({ success: true, message: 'Mensagem recebida (duplicado detectado).' });
        }
      } catch (checkErr) {
        console.error('[contactos] duplicate check failed:', checkErr);
        // continue to insert if check failed
      }

      // Inserir na base de dados
      await pool.query(
        "INSERT INTO form_contacto (nome, email, assunto, mensagem) VALUES ($1, $2, $3, $4)",
        [nome, email, assunto, mensagem]
      );

      // Enviar email de notificação (opcional) — feito de forma segura via util
      try {
        const { sendMailSafe } = require('../utils/email');
        const mail = {
          from: process.env.EMAIL_FROM,
          to: process.env.EMAIL_FROM,
          subject: `Nova mensagem de contacto: ${assunto}`,
          html: `
          <h2>Nova mensagem de contacto</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Assunto:</strong> ${assunto}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${mensagem}</p>
        `,
        };
        const result = await sendMailSafe(mail);
        if (!result.ok) {
          console.warn('Notificação por email não enviada:', result.error && result.error.message ? result.error.message : result.error);
        }
      } catch (emailError) {
        console.error('Erro ao tentar enviar notificação por email (unexpected):', emailError);
      }

      res.status(201).json({
        success: true,
        message:
          "Mensagem enviada com sucesso. Entraremos em contacto em breve.",
      });
    } catch (error) {
      console.error("Erro ao enviar formulário de contacto:", error);
      res.status(500).json({
        success: false,
        message: "Erro no servidor.",
      });
    }
  }
);

module.exports = router;
