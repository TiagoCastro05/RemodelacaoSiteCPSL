const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// carregar variáveis de ambiente (.env) da raiz do projeto ou da pasta server
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const rootEnv = path.resolve(__dirname, "..", ".env");
const serverEnv = path.resolve(__dirname, ".env");
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
  console.log(`Loaded env from ${rootEnv}`);
} else if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
  console.log(`Loaded env from ${serverEnv}`);
} else {
  // fallback para comportamento por defeito
  dotenv.config();
  console.log("Loaded env from default path (.env)");
}

const app = express();

// Global error handlers to avoid the process exiting unexpectedly in dev
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // optionally: send to monitoring service
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
  // Note: in production you may want to shutdown the process gracefully
});

// Middleware de segurança
app.use(helmet());

// CORS
// Permitir múltiplas origens em desenvolvimento. Defina CLIENT_URL com
// uma lista separada por vírgulas (ex: http://localhost:3000,http://localhost:3001)
// Por defeito permitir 3000 e 3001 em desenvolvimento para evitar problemas
// quando o frontend corre em diferentes portas.
const CLIENT_URLS = (
  process.env.CLIENT_URL || "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((u) => u.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Requests sem origin (ex: ferramentas de linha de comando, servidores) são permitidos
      if (!origin) return callback(null, true);

      // Permitir qualquer origin localhost em ambiente de desenvolvimento
      if (
        process.env.NODE_ENV !== "production" &&
        origin.startsWith("http://localhost")
      ) {
        return callback(null, true);
      }

      // Permitir todos os domínios .vercel.app
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      if (CLIENT_URLS.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 em dev, 100 em produção
  message: "Demasiados pedidos deste IP, tente novamente mais tarde.",
});
app.use("/api/", limiter);

// Servir ficheiros estáticos (uploads) apenas se houver diretório local
// Em produção no Vercel recomenda-se usar Cloudinary; o disco é efémero.
const uploadsPath = path.resolve(__dirname, "..", "uploads");
if (fs.existsSync(uploadsPath)) {
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    const rel = req.path.replace(/^\//, "");
    const tryPath = path.join(uploadsPath, rel);
    if (fs.existsSync(tryPath)) {
      return res.sendFile(tryPath);
    }
    const subfolders = ["imagens", "videos", "pdfs", "outros"];
    for (const f of subfolders) {
      const alt = path.join(uploadsPath, f, rel);
      if (fs.existsSync(alt)) return res.sendFile(alt);
    }
    next();
  });
  app.use("/uploads", express.static("uploads"));
}

// Rotas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/contactos", require("./routes/contactos"));
app.use("/api/forms", require("./routes/forms"));
app.use("/api/projetos", require("./routes/projetos"));
app.use("/api/noticias", require("./routes/noticias"));
app.use("/api/respostas-sociais", require("./routes/respostasSociais"));
app.use("/api/transparencia", require("./routes/transparencia"));
app.use("/api/conteudo", require("./routes/conteudo"));
app.use("/api/media", require("./routes/media"));
app.use("/api/mensagens", require("./routes/mensagens"));
app.use("/api/secoes-personalizadas", require("./routes/secoesPersonalizadas"));

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
