const bcrypt = require("bcryptjs");

const password = process.argv[2] || "Admin123!";

bcrypt
  .hash(password, 10)
  .then((hash) => {
    console.log("\n========================================");
    console.log("Password Hash Generator");
    console.log("========================================\n");
    console.log("Password:", password);
    console.log("\nHash:");
    console.log(hash);
    console.log("\n========================================");
    console.log("Use este hash no SQL:");
    console.log("========================================\n");
    console.log(
      `INSERT INTO Utilizadores (nome, email, password_hash, tipo) VALUES`
    );
    console.log(
      `('Administrador', 'admin@cpslanheses.pt', '${hash}', 'Admin');`
    );
    console.log("\n========================================\n");
  })
  .catch((err) => {
    console.error("Erro:", err);
  });
