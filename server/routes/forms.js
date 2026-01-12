const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");

const router = express.Router();

// Helpers
const ensureCommonColumns = async (tableName) => {
  await pool.query(
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS lido BOOLEAN DEFAULT false`
  );
  await pool.query(
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS lido_em TIMESTAMPTZ`
  );
  await pool.query(
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS origem_submissao TEXT`
  );
  await pool.query(
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS secao_personalizada_id INTEGER`
  );
  await pool.query(
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS formulario_escolhido TEXT`
  );
};

// Garantir tabelas/colunas (migração suave em tempo de arranque)
const ensureErpiTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forms_erpi (
      id SERIAL PRIMARY KEY,
      nome_completo           TEXT NOT NULL,
      data_nascimento         DATE NOT NULL,
      morada_completa         TEXT NOT NULL,
      codigo_postal           VARCHAR(20) NOT NULL,
      concelho                TEXT NOT NULL,
      distrito                TEXT NOT NULL,
      cc_bi_numero            VARCHAR(50) NOT NULL,
      nif                     VARCHAR(50) NOT NULL,
      niss                    VARCHAR(50) NOT NULL,
      numero_utente           VARCHAR(50) NOT NULL,
      contacto_nome_completo  TEXT NOT NULL,
      contacto_telefone       VARCHAR(30) NOT NULL,
      contacto_email          TEXT NOT NULL,
      contacto_parentesco     TEXT NOT NULL,
      observacoes             TEXT,
      criado_em               TIMESTAMPTZ DEFAULT now()
    );
  `);

  await ensureCommonColumns("forms_erpi");

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_erpi_nif ON forms_erpi (nif)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_erpi_data ON forms_erpi (data_nascimento)`
  );
};

const ensureCentroDiaTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forms_centro_de_dia (
      id SERIAL PRIMARY KEY,
      nome_completo           TEXT NOT NULL,
      data_nascimento         DATE NOT NULL,
      morada_completa         TEXT NOT NULL,
      codigo_postal           VARCHAR(20) NOT NULL,
      concelho                TEXT NOT NULL,
      distrito                TEXT NOT NULL,
      cc_bi_numero            VARCHAR(50) NOT NULL,
      nif                     VARCHAR(50) NOT NULL,
      niss                    VARCHAR(50) NOT NULL,
      numero_utente           VARCHAR(50) NOT NULL,
      contacto_nome_completo  TEXT NOT NULL,
      contacto_telefone       VARCHAR(30) NOT NULL,
      contacto_email          TEXT NOT NULL,
      contacto_parentesco     TEXT NOT NULL,
      observacoes             TEXT,
      criado_em               TIMESTAMPTZ DEFAULT now()
    );
  `);

  await ensureCommonColumns("forms_centro_de_dia");

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_centro_nif ON forms_centro_de_dia (nif)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_centro_data ON forms_centro_de_dia (data_nascimento)`
  );
};

const ensureSadTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forms_sad (
      id SERIAL PRIMARY KEY,
      nome_completo           TEXT NOT NULL,
      data_nascimento         DATE NOT NULL,
      morada_completa         TEXT NOT NULL,
      codigo_postal           VARCHAR(20) NOT NULL,
      concelho                TEXT NOT NULL,
      distrito                TEXT NOT NULL,
      cc_bi_numero            VARCHAR(50) NOT NULL,
      nif                     VARCHAR(50) NOT NULL,
      niss                    VARCHAR(50) NOT NULL,
      numero_utente           VARCHAR(50) NOT NULL,
      contacto_nome_completo  TEXT NOT NULL,
      contacto_telefone       VARCHAR(30) NOT NULL,
      contacto_email          TEXT NOT NULL,
      contacto_parentesco     TEXT NOT NULL,
      observacoes             TEXT,
      higiene_pessoal         BOOLEAN DEFAULT false,
      higiene_habitacional    BOOLEAN DEFAULT false,
      refeicoes               BOOLEAN DEFAULT false,
      tratamento_roupa        BOOLEAN DEFAULT false,
      periodicidade_higiene_pessoal        VARCHAR(30),
      vezes_higiene_pessoal               INTEGER,
      periodicidade_higiene_habitacional  VARCHAR(30),
      vezes_higiene_habitacional          INTEGER,
      periodicidade_refeicoes             VARCHAR(30),
      vezes_refeicoes                     INTEGER,
      periodicidade_tratamento_roupa      VARCHAR(30),
      vezes_tratamento_roupa              INTEGER,
      criado_em               TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT chk_sad_periodicidade
        CHECK (
          (periodicidade_higiene_pessoal IS NULL OR periodicidade_higiene_pessoal IN ('segunda a sexta','segunda a sabado','segunda a domingo')) AND
          (periodicidade_higiene_habitacional IS NULL OR periodicidade_higiene_habitacional IN ('segunda a sexta','segunda a sabado','segunda a domingo')) AND
          (periodicidade_refeicoes IS NULL OR periodicidade_refeicoes IN ('segunda a sexta','segunda a sabado','segunda a domingo')) AND
          (periodicidade_tratamento_roupa IS NULL OR periodicidade_tratamento_roupa IN ('segunda a sexta','segunda a sabado','segunda a domingo'))
        ),
      CONSTRAINT chk_sad_vezes
        CHECK (
          (vezes_higiene_pessoal IS NULL OR vezes_higiene_pessoal BETWEEN 1 AND 5) AND
          (vezes_higiene_habitacional IS NULL OR vezes_higiene_habitacional BETWEEN 1 AND 5) AND
          (vezes_refeicoes IS NULL OR vezes_refeicoes BETWEEN 1 AND 5) AND
          (vezes_tratamento_roupa IS NULL OR vezes_tratamento_roupa BETWEEN 1 AND 5)
        )
    );
  `);

  // Garantir colunas novas em tabelas já existentes
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS periodicidade_higiene_pessoal VARCHAR(30)`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS vezes_higiene_pessoal INTEGER`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS periodicidade_higiene_habitacional VARCHAR(30)`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS vezes_higiene_habitacional INTEGER`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS periodicidade_refeicoes VARCHAR(30)`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS vezes_refeicoes INTEGER`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS periodicidade_tratamento_roupa VARCHAR(30)`
  );
  await pool.query(
    `ALTER TABLE forms_sad ADD COLUMN IF NOT EXISTS vezes_tratamento_roupa INTEGER`
  );

  // Atualizar constraints (dropar se existirem e recriar)
  await pool.query(`ALTER TABLE forms_sad DROP CONSTRAINT IF EXISTS chk_sad_periodicidade`);
  await pool.query(`ALTER TABLE forms_sad DROP CONSTRAINT IF EXISTS chk_sad_vezes`);
  await pool.query(`
    ALTER TABLE forms_sad
    ADD CONSTRAINT chk_sad_periodicidade CHECK (
      (periodicidade_higiene_pessoal IS NULL OR periodicidade_higiene_pessoal IN ('segunda a sexta','segunda a sabado','segunda a domingo')) AND
      (periodicidade_higiene_habitacional IS NULL OR periodicidade_higiene_habitacional IN ('segunda a sexta','segunda a sabado','segunda a domingo')) AND
      (periodicidade_refeicoes IS NULL OR periodicidade_refeicoes IN ('segunda a sexta','segunda a sabado','segunda a domingo')) AND
      (periodicidade_tratamento_roupa IS NULL OR periodicidade_tratamento_roupa IN ('segunda a sexta','segunda a sabado','segunda a domingo'))
    )
  `);
  await pool.query(`
    ALTER TABLE forms_sad
    ADD CONSTRAINT chk_sad_vezes CHECK (
      (vezes_higiene_pessoal IS NULL OR vezes_higiene_pessoal BETWEEN 1 AND 5) AND
      (vezes_higiene_habitacional IS NULL OR vezes_higiene_habitacional BETWEEN 1 AND 5) AND
      (vezes_refeicoes IS NULL OR vezes_refeicoes BETWEEN 1 AND 5) AND
      (vezes_tratamento_roupa IS NULL OR vezes_tratamento_roupa BETWEEN 1 AND 5)
    )
  `);

  await ensureCommonColumns("forms_sad");

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_sad_nif ON forms_sad (nif)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_sad_data ON forms_sad (data_nascimento)`
  );
};

const ensureCrecheTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forms_creche (
      id SERIAL PRIMARY KEY,
      creche_opcao           TEXT,
      creche_item_id         INTEGER,
      nome_completo          TEXT NOT NULL,
      morada                 TEXT NOT NULL,
      codigo_postal          VARCHAR(20) NOT NULL,
      localidade             TEXT NOT NULL,
      crianca_nasceu         BOOLEAN NOT NULL,
      data_nascimento        DATE,
      data_prevista          DATE,
      cc_bi_numero           VARCHAR(50),
      nif                    VARCHAR(50),
      niss                   VARCHAR(50),
      numero_utente          VARCHAR(50),

      mae_nome               TEXT,
      mae_profissao          TEXT,
      mae_local_emprego      TEXT,
      mae_morada             TEXT,
      mae_codigo_postal      VARCHAR(20),
      mae_localidade         TEXT,
      mae_telemovel          VARCHAR(30),
      mae_email              TEXT,

      pai_nome               TEXT,
      pai_profissao          TEXT,
      pai_local_emprego      TEXT,
      pai_morada             TEXT,
      pai_codigo_postal      VARCHAR(20),
      pai_localidade         TEXT,
      pai_telemovel          VARCHAR(30),
      pai_email              TEXT,

      irmaos_frequentam      BOOLEAN,
      necessita_apoio        BOOLEAN,
      apoio_especificacao    TEXT,
      criado_em              TIMESTAMPTZ DEFAULT now()
    );
  `);

  await ensureCommonColumns("forms_creche");

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_creche_nif ON forms_creche (nif)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_forms_creche_data ON forms_creche (data_nascimento)`
  );
};

Promise.all([
  ensureErpiTable(),
  ensureCentroDiaTable(),
  ensureSadTable(),
  ensureCrecheTable(),
]).catch((err) =>
  console.error("Erro ao garantir tabelas de forms:", err.message)
);

// GET /api/forms/erpi - listar inscrições ERPI (mais recentes primeiro)
// optional query ?lido=false para apenas não lidas
router.get("/erpi", async (req, res) => {
  try {
    const { lido } = req.query;
    let query = `SELECT * FROM forms_erpi`;
    const params = [];

    if (lido === "false") {
      query += ` WHERE (lido = false OR lido IS NULL)`;
    } else if (lido === "true") {
      query += ` WHERE lido = true`;
    }

    query += ` ORDER BY criado_em DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições ERPI:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET /api/forms/centro-de-dia - listar inscrições
router.get("/centro-de-dia", async (req, res) => {
  try {
    const { lido } = req.query;
    let query = `SELECT * FROM forms_centro_de_dia`;
    if (lido === "false") {
      query += ` WHERE (lido = false OR lido IS NULL)`;
    } else if (lido === "true") {
      query += ` WHERE lido = true`;
    }
    query += ` ORDER BY criado_em DESC`;
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições Centro de Dia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET /api/forms/sad - listar inscrições
router.get("/sad", async (req, res) => {
  try {
    const { lido } = req.query;
    let query = `SELECT * FROM forms_sad`;
    if (lido === "false") {
      query += ` WHERE (lido = false OR lido IS NULL)`;
    } else if (lido === "true") {
      query += ` WHERE lido = true`;
    }
    query += ` ORDER BY criado_em DESC`;
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições SAD:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// GET /api/forms/creche - listar inscrições
router.get("/creche", async (req, res) => {
  try {
    const { lido } = req.query;
    let query = `SELECT * FROM forms_creche`;
    if (lido === "false") {
      query += ` WHERE (lido = false OR lido IS NULL)`;
    } else if (lido === "true") {
      query += ` WHERE lido = true`;
    }
    query += ` ORDER BY criado_em DESC`;
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições Creche:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST /api/forms/erpi - submissão de inscrição ERPI
router.post(
  "/erpi",
  [
    body("nome_completo").notEmpty(),
    body("data_nascimento").notEmpty(),
    body("morada_completa").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("concelho").notEmpty(),
    body("distrito").notEmpty(),
    body("cc_bi_numero").notEmpty(),
    body("nif").notEmpty(),
    body("niss").notEmpty(),
    body("numero_utente").notEmpty(),
    body("contacto_nome_completo").notEmpty(),
    body("contacto_telefone").notEmpty(),
    body("contacto_email").isEmail(),
    body("contacto_parentesco").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        nome_completo,
        data_nascimento,
        morada_completa,
        codigo_postal,
        concelho,
        distrito,
        cc_bi_numero,
        nif,
        niss,
        numero_utente,
        contacto_nome_completo,
        contacto_telefone,
        contacto_email,
        contacto_parentesco,
        observacoes,
      } = req.body;

      await pool.query(
        `INSERT INTO forms_erpi (
          nome_completo,
          data_nascimento,
          morada_completa,
          codigo_postal,
          concelho,
          distrito,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          contacto_nome_completo,
          contacto_telefone,
          contacto_email,
          contacto_parentesco,
          observacoes,
          origem_submissao,
          secao_personalizada_id,
          formulario_escolhido,
          lido
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, false
        )`,
        [
          nome_completo,
          data_nascimento,
          morada_completa,
          codigo_postal,
          concelho,
          distrito,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          contacto_nome_completo,
          contacto_telefone,
          contacto_email,
          contacto_parentesco,
          observacoes || null,
          req.body.origem_submissao || null,
          req.body.secao_personalizada_id || null,
          req.body.formulario_escolhido || null,
        ]
      );

      res.status(201).json({ success: true, message: "Inscrição ERPI recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição ERPI:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// POST /api/forms/centro-de-dia
router.post(
  "/centro-de-dia",
  [
    body("nome_completo").notEmpty(),
    body("data_nascimento").notEmpty(),
    body("morada_completa").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("concelho").notEmpty(),
    body("distrito").notEmpty(),
    body("cc_bi_numero").notEmpty(),
    body("nif").notEmpty(),
    body("niss").notEmpty(),
    body("numero_utente").notEmpty(),
    body("contacto_nome_completo").notEmpty(),
    body("contacto_telefone").notEmpty(),
    body("contacto_email").isEmail(),
    body("contacto_parentesco").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        nome_completo,
        data_nascimento,
        morada_completa,
        codigo_postal,
        concelho,
        distrito,
        cc_bi_numero,
        nif,
        niss,
        numero_utente,
        contacto_nome_completo,
        contacto_telefone,
        contacto_email,
        contacto_parentesco,
        observacoes,
      } = req.body;

      await pool.query(
        `INSERT INTO forms_centro_de_dia (
          nome_completo,
          data_nascimento,
          morada_completa,
          codigo_postal,
          concelho,
          distrito,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          contacto_nome_completo,
          contacto_telefone,
          contacto_email,
          contacto_parentesco,
          observacoes,
          origem_submissao,
          secao_personalizada_id,
          formulario_escolhido,
          lido
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, false
        )`,
        [
          nome_completo,
          data_nascimento,
          morada_completa,
          codigo_postal,
          concelho,
          distrito,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          contacto_nome_completo,
          contacto_telefone,
          contacto_email,
          contacto_parentesco,
          observacoes || null,
          req.body.origem_submissao || null,
          req.body.secao_personalizada_id || null,
          req.body.formulario_escolhido || null,
        ]
      );

      res
        .status(201)
        .json({ success: true, message: "Inscrição Centro de Dia recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição Centro de Dia:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// POST /api/forms/sad
router.post(
  "/sad",
  [
    body("nome_completo").notEmpty(),
    body("data_nascimento").notEmpty(),
    body("morada_completa").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("concelho").notEmpty(),
    body("distrito").notEmpty(),
    body("cc_bi_numero").notEmpty(),
    body("nif").notEmpty(),
    body("niss").notEmpty(),
    body("numero_utente").notEmpty(),
    body("contacto_nome_completo").notEmpty(),
    body("contacto_telefone").notEmpty(),
    body("contacto_email").isEmail(),
    body("contacto_parentesco").notEmpty(),
    body("periodicidade_higiene_pessoal")
      .optional({ checkFalsy: true })
      .isIn(["segunda a sexta", "segunda a sabado", "segunda a domingo"]),
    body("vezes_higiene_pessoal")
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 5 }),
    body("periodicidade_higiene_habitacional")
      .optional({ checkFalsy: true })
      .isIn(["segunda a sexta", "segunda a sabado", "segunda a domingo"]),
    body("vezes_higiene_habitacional")
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 5 }),
    body("periodicidade_refeicoes")
      .optional({ checkFalsy: true })
      .isIn(["segunda a sexta", "segunda a sabado", "segunda a domingo"]),
    body("vezes_refeicoes")
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 5 }),
    body("periodicidade_tratamento_roupa")
      .optional({ checkFalsy: true })
      .isIn(["segunda a sexta", "segunda a sabado", "segunda a domingo"]),
    body("vezes_tratamento_roupa")
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        nome_completo,
        data_nascimento,
        morada_completa,
        codigo_postal,
        concelho,
        distrito,
        cc_bi_numero,
        nif,
        niss,
        numero_utente,
        contacto_nome_completo,
        contacto_telefone,
        contacto_email,
        contacto_parentesco,
        observacoes,
        higiene_pessoal,
        higiene_habitacional,
        refeicoes,
        tratamento_roupa,
        periodicidade_higiene_pessoal,
        vezes_higiene_pessoal,
        periodicidade_higiene_habitacional,
        vezes_higiene_habitacional,
        periodicidade_refeicoes,
        vezes_refeicoes,
        periodicidade_tratamento_roupa,
        vezes_tratamento_roupa,
      } = req.body;

      await pool.query(
        `INSERT INTO forms_sad (
          nome_completo,
          data_nascimento,
          morada_completa,
          codigo_postal,
          concelho,
          distrito,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          contacto_nome_completo,
          contacto_telefone,
          contacto_email,
          contacto_parentesco,
          observacoes,
          higiene_pessoal,
          higiene_habitacional,
          refeicoes,
          tratamento_roupa,
          periodicidade_higiene_pessoal,
          vezes_higiene_pessoal,
          periodicidade_higiene_habitacional,
          vezes_higiene_habitacional,
          periodicidade_refeicoes,
          vezes_refeicoes,
          periodicidade_tratamento_roupa,
          vezes_tratamento_roupa,
          origem_submissao,
          secao_personalizada_id,
          formulario_escolhido,
          lido
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, false
        )`,
        [
          nome_completo,
          data_nascimento,
          morada_completa,
          codigo_postal,
          concelho,
          distrito,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          contacto_nome_completo,
          contacto_telefone,
          contacto_email,
          contacto_parentesco,
          observacoes || null,
          Boolean(higiene_pessoal),
          Boolean(higiene_habitacional),
          Boolean(refeicoes),
          Boolean(tratamento_roupa),
          periodicidade_higiene_pessoal || null,
          vezes_higiene_pessoal || null,
          periodicidade_higiene_habitacional || null,
          vezes_higiene_habitacional || null,
          periodicidade_refeicoes || null,
          vezes_refeicoes || null,
          periodicidade_tratamento_roupa || null,
          vezes_tratamento_roupa || null,
          req.body.origem_submissao || null,
          req.body.secao_personalizada_id || null,
          req.body.formulario_escolhido || null,
        ]
      );

      res
        .status(201)
        .json({ success: true, message: "Inscrição SAD recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição SAD:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// POST /api/forms/creche
router.post(
  "/creche",
  [
    body("nome_completo").notEmpty(),
    body("morada").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("localidade").notEmpty(),
    body("crianca_nasceu").isBoolean(),
    body("data_nascimento").custom((value, { req }) => {
      if (String(req.body.crianca_nasceu) === "true" && !value) {
        throw new Error("Data de nascimento é obrigatória quando a criança já nasceu.");
      }
      return true;
    }),
    body("data_prevista").custom((value, { req }) => {
      if (String(req.body.crianca_nasceu) === "false" && !value) {
        throw new Error("Data prevista é obrigatória quando a criança ainda não nasceu.");
      }
      return true;
    }),
    body("mae_email").optional({ checkFalsy: true }).isEmail(),
    body("pai_email").optional({ checkFalsy: true }).isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        creche_opcao,
        creche_item_id,
        nome_completo,
        morada,
        codigo_postal,
        localidade,
        crianca_nasceu,
        data_nascimento,
        data_prevista,
        cc_bi_numero,
        nif,
        niss,
        numero_utente,
        mae_nome,
        mae_profissao,
        mae_local_emprego,
        mae_morada,
        mae_codigo_postal,
        mae_localidade,
        mae_telemovel,
        mae_email,
        pai_nome,
        pai_profissao,
        pai_local_emprego,
        pai_morada,
        pai_codigo_postal,
        pai_localidade,
        pai_telemovel,
        pai_email,
        irmaos_frequentam,
        necessita_apoio,
        apoio_especificacao,
      } = req.body;

      await pool.query(
        `INSERT INTO forms_creche (
          creche_opcao,
          creche_item_id,
          nome_completo,
          morada,
          codigo_postal,
          localidade,
          crianca_nasceu,
          data_nascimento,
          data_prevista,
          cc_bi_numero,
          nif,
          niss,
          numero_utente,
          mae_nome,
          mae_profissao,
          mae_local_emprego,
          mae_morada,
          mae_codigo_postal,
          mae_localidade,
          mae_telemovel,
          mae_email,
          pai_nome,
          pai_profissao,
          pai_local_emprego,
          pai_morada,
          pai_codigo_postal,
          pai_localidade,
          pai_telemovel,
          pai_email,
          irmaos_frequentam,
          necessita_apoio,
          apoio_especificacao,
          origem_submissao,
          secao_personalizada_id,
          formulario_escolhido
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )`,
        [
          creche_opcao || null,
          creche_item_id ? Number(creche_item_id) : null,
          nome_completo,
          morada,
          codigo_postal,
          localidade,
          String(crianca_nasceu) === "true",
          data_nascimento || null,
          data_prevista || null,
          cc_bi_numero || null,
          nif || null,
          niss || null,
          numero_utente || null,
          mae_nome || null,
          mae_profissao || null,
          mae_local_emprego || null,
          mae_morada || null,
          mae_codigo_postal || null,
          mae_localidade || null,
          mae_telemovel || null,
          mae_email || null,
          pai_nome || null,
          pai_profissao || null,
          pai_local_emprego || null,
          pai_morada || null,
          pai_codigo_postal || null,
          pai_localidade || null,
          pai_telemovel || null,
          pai_email || null,
          typeof irmaos_frequentam !== "undefined"
            ? String(irmaos_frequentam) === "true"
            : null,
          typeof necessita_apoio !== "undefined"
            ? String(necessita_apoio) === "true"
            : null,
          apoio_especificacao || null,
          req.body.origem_submissao || null,
          req.body.secao_personalizada_id || null,
          req.body.formulario_escolhido || null
        ]
      );

      res
        .status(201)
        .json({ success: true, message: "Inscrição Creche recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição Creche:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// PUT /api/forms/erpi/:id/read - marcar como lido
router.put("/erpi/:id/read", async (req, res) => {
  try {
    await pool.query(
      `UPDATE forms_erpi SET lido = true, lido_em = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar inscrição ERPI como lida:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

router.put("/centro-de-dia/:id/read", async (req, res) => {
  try {
    await pool.query(
      `UPDATE forms_centro_de_dia SET lido = true, lido_em = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar inscrição Centro de Dia como lida:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

router.put("/sad/:id/read", async (req, res) => {
  try {
    await pool.query(
      `UPDATE forms_sad SET lido = true, lido_em = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar inscrição SAD como lida:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

router.put("/creche/:id/read", async (req, res) => {
  try {
    await pool.query(
      `UPDATE forms_creche SET lido = true, lido_em = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar inscrição Creche como lida:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// DELETE /api/forms/erpi/:id - eliminar inscrição
router.delete("/erpi/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM forms_erpi WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar inscrição ERPI:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

router.delete("/centro-de-dia/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM forms_centro_de_dia WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar inscrição Centro de Dia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

router.delete("/sad/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM forms_sad WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar inscrição SAD:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

router.delete("/creche/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM forms_creche WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar inscrição Creche:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;