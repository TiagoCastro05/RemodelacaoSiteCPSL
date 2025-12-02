const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Middleware de segurança
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requests por windowMs
  message: "Demasiados pedidos deste IP, tente novamente mais tarde.",
});
app.use("/api/", limiter);

// Servir ficheiros estáticos (uploads)
app.use("/uploads", express.static("uploads"));

// Rotas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/contactos", require("./routes/contactos"));
app.use("/api/projetos", require("./routes/projetos"));
app.use("/api/noticias", require("./routes/noticias"));
app.use("/api/respostas-sociais", require("./routes/respostasSociais"));
app.use("/api/transparencia", require("./routes/transparencia"));
app.use("/api/conteudo", require("./routes/conteudo"));
app.use("/api/media", require("./routes/media"));
app.use("/api/mensagens", require("./routes/mensagens"));

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API CPSL a funcionar!",
    timestamp: new Date().toISOString(),
  });
});

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada.",
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Erro no servidor.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
