const { Pool } = require("pg");
require("dotenv").config();

// Criar pool de conexões PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessário para Supabase
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Aumentado para 10 segundos
  // Forçar uso de IPv4
  options: "-c client_encoding=UTF8",
});

// Testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log(
      "✅ Conexão à base de dados PostgreSQL (Supabase) estabelecida com sucesso!"
    );
    client.release();
  } catch (error) {
    console.error("❌ Erro ao conectar à base de dados:", error.message);
    console.error("Verifique se DATABASE_URL está configurada no .env");
    process.exit(1);
  }
};

testConnection();

// Wrapper para compatibilidade MySQL → PostgreSQL
const originalQuery = pool.query.bind(pool);
pool.query = async function (text, params) {
  try {
    // Converter placeholders MySQL (?) para PostgreSQL ($1, $2...)
    let convertedText = text;
    let convertedParams = params || [];

    if (text.includes("?") && params) {
      let paramIndex = 1;
      convertedText = text.replace(/\?/g, () => `$${paramIndex++}`);
    }

    // Converter nomes de tabelas para lowercase
    convertedText = convertedText
      .replace(/FROM\s+Utilizadores/gi, "FROM utilizadores")
      .replace(/FROM\s+Projetos/gi, "FROM projetos")
      .replace(/FROM\s+Media/gi, "FROM media")
      .replace(/FROM\s+Conteudo_Institucional/gi, "FROM conteudo_institucional")
      .replace(/FROM\s+Noticias_Eventos/gi, "FROM noticias_eventos")
      .replace(/FROM\s+Respostas_Sociais/gi, "FROM respostas_sociais")
      .replace(/FROM\s+Form_Contacto/gi, "FROM form_contacto")
      .replace(/FROM\s+Transparencia/gi, "FROM transparencia")
      .replace(
        /FROM\s+Contactos_Institucionais/gi,
        "FROM contactos_institucionais"
      )
      .replace(/UPDATE\s+Utilizadores/gi, "UPDATE utilizadores")
      .replace(/UPDATE\s+Projetos/gi, "UPDATE projetos")
      .replace(/UPDATE\s+Media/gi, "UPDATE media")
      .replace(
        /UPDATE\s+Conteudo_Institucional/gi,
        "UPDATE conteudo_institucional"
      )
      .replace(/UPDATE\s+Noticias_Eventos/gi, "UPDATE noticias_eventos")
      .replace(/UPDATE\s+Respostas_Sociais/gi, "UPDATE respostas_sociais")
      .replace(/UPDATE\s+Form_Contacto/gi, "UPDATE form_contacto")
      .replace(/UPDATE\s+Transparencia/gi, "UPDATE transparencia")
      .replace(/INSERT\s+INTO\s+Utilizadores/gi, "INSERT INTO utilizadores")
      .replace(/INSERT\s+INTO\s+Projetos/gi, "INSERT INTO projetos")
      .replace(/INSERT\s+INTO\s+Media/gi, "INSERT INTO media")
      .replace(/DELETE\s+FROM\s+Utilizadores/gi, "DELETE FROM utilizadores")
      .replace(/DELETE\s+FROM\s+Projetos/gi, "DELETE FROM projetos")
      .replace(/DELETE\s+FROM\s+Media/gi, "DELETE FROM media")
      .replace(/DELETE\s+FROM\s+Form_Contacto/gi, "DELETE FROM form_contacto")
      .replace(/DELETE\s+FROM\s+Transparencia/gi, "DELETE FROM transparencia")
      .replace(
        /DELETE\s+FROM\s+Respostas_Sociais/gi,
        "DELETE FROM respostas_sociais"
      )
      .replace(
        /DELETE\s+FROM\s+Noticias_Eventos/gi,
        "DELETE FROM noticias_eventos"
      )
      // Converter booleanos
      .replace(/=\s*TRUE\b/gi, "= true")
      .replace(/=\s*FALSE\b/gi, "= false")
      .replace(/WHERE\s+ativo\s*=\s*TRUE/gi, "WHERE ativo = true")
      .replace(/WHERE\s+ativo\s*=\s*FALSE/gi, "WHERE ativo = false");

    const result = await originalQuery(convertedText, convertedParams);

    // Adicionar RETURNING para INSERTs
    if (
      convertedText.trim().toUpperCase().startsWith("INSERT") &&
      !convertedText.toUpperCase().includes("RETURNING")
    ) {
      // Re-executar com RETURNING
      const insertQuery = convertedText
        .trim()
        .replace(/;?\s*$/, " RETURNING *");
      const insertResult = await originalQuery(insertQuery, convertedParams);
      const resultObj = {
        insertId: insertResult.rows[0]?.id || null,
        affectedRows: insertResult.rowCount,
      };
      return [resultObj];
    }

    // Retornar no formato MySQL: [rows] - garantir que rows existe
    return [result.rows || []];
  } catch (error) {
    console.error("Query error:", error.message);
    console.error("Original query:", text);
    throw error;
  }
};

module.exports = pool;
