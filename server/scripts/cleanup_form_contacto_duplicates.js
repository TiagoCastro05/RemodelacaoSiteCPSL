// Script para remover duplicados de form_contacto mantendo a mais recente por grupo
// Uso: node server/scripts/cleanup_form_contacto_duplicates.js

const pool = require('../config/database');

async function cleanup() {
  try {
    console.log('Starting duplicate cleanup for form_contacto...');
    const deleteSql = `WITH duplicates AS (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY nome, email, assunto, mensagem ORDER BY data_submissao DESC) AS rn
      FROM form_contacto
    )
    DELETE FROM form_contacto
    WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
    `;

    await pool.query(deleteSql);

    // report remaining duplicates (should be 0)
    const checkSql = `SELECT nome, email, assunto, COUNT(*) as cnt FROM form_contacto GROUP BY nome, email, assunto HAVING COUNT(*) > 1 LIMIT 10`;
    const [rows] = await pool.query(checkSql);
    if (rows.length === 0) {
      console.log('Cleanup complete. No duplicates found.');
    } else {
      console.log('Some duplicates remain (sample):', rows.slice(0, 10));
    }

    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
