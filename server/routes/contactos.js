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

      // Inserir na base de dados
      await pool.query(
        "INSERT INTO form_contacto (nome, email, assunto, mensagem) VALUES ($1, $2, $3, $4)",
        [nome, email, assunto, mensagem]
      );

      // Enviar email de notificação (opcional)
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
        });
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError);
        // Não falhar o request se o email não for enviado
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
