const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");

const router = express.Router();

// Util: executa transação
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// SELECT helpers
const buildLidoFilter = (lido) => {
  if (lido === "false") return "(i.lido = false OR i.lido IS NULL)";
  if (lido === "true") return "i.lido = true";
  return "1=1";
};

// LISTAGEM - ERPI
router.get("/erpi", async (req, res) => {
  try {
    const { lido } = req.query;
    const filter = buildLidoFilter(lido);
    const [rows] = await pool.query(
      `SELECT i.id,
              i.lido,
              i.lido_em,
              i.data_inscricao AS criado_em,
              i.observacoes,
              i.origem_submissao,
              i.secao_personalizada_id,
              i.formulario_escolhido,
              p.nome_completo,
              p.data_nascimento,
              p.morada_completa,
              p.codigo_postal,
              p.localidade,
              p.concelho,
              p.distrito,
              p.cc_bi_numero,
              p.nif,
              p.niss,
              p.numero_utente,
              ce.nome AS contacto_nome_completo,
              ce.telefone AS contacto_telefone,
              ce.email AS contacto_email,
              ce.parentesco AS contacto_parentesco
       FROM inscricoes i
       JOIN pessoas p ON p.id = i.pessoa_id
       LEFT JOIN contactos_emergencia ce ON ce.pessoa_id = p.id
       WHERE i.servico = 'ERPI' AND ${filter}
       ORDER BY i.data_inscricao DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições ERPI:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// LISTAGEM - CENTRO DE DIA
router.get("/centro-de-dia", async (req, res) => {
  try {
    const { lido } = req.query;
    const filter = buildLidoFilter(lido);
    const [rows] = await pool.query(
      `SELECT i.id,
              i.lido,
              i.lido_em,
              i.data_inscricao AS criado_em,
              i.observacoes,
              i.origem_submissao,
              i.secao_personalizada_id,
              i.formulario_escolhido,
              p.nome_completo,
              p.data_nascimento,
              p.morada_completa,
              p.codigo_postal,
              p.localidade,
              p.concelho,
              p.distrito,
              p.cc_bi_numero,
              p.nif,
              p.niss,
              p.numero_utente,
              ce.nome AS contacto_nome_completo,
              ce.telefone AS contacto_telefone,
              ce.email AS contacto_email,
              ce.parentesco AS contacto_parentesco
       FROM inscricoes i
       JOIN pessoas p ON p.id = i.pessoa_id
       LEFT JOIN contactos_emergencia ce ON ce.pessoa_id = p.id
       WHERE i.servico = 'CENTRO_DIA' AND ${filter}
       ORDER BY i.data_inscricao DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições Centro de Dia:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// LISTAGEM - SAD
router.get("/sad", async (req, res) => {
  try {
    const { lido } = req.query;
    const filter = buildLidoFilter(lido);
    const [rows] = await pool.query(
      `SELECT i.id,
              i.lido,
              i.lido_em,
              i.data_inscricao AS criado_em,
              i.observacoes,
              i.origem_submissao,
              i.secao_personalizada_id,
              i.formulario_escolhido,
              p.nome_completo,
              p.data_nascimento,
              p.morada_completa,
              p.codigo_postal,
              p.localidade,
              p.concelho,
              p.distrito,
              p.cc_bi_numero,
              p.nif,
              p.niss,
              p.numero_utente,
              ce.nome AS contacto_nome_completo,
              ce.telefone AS contacto_telefone,
              ce.email AS contacto_email,
              ce.parentesco AS contacto_parentesco,
              ds.higiene_pessoal,
              ds.periodicidade_higiene_pessoal,
              ds.vezes_higiene_pessoal,
              ds.higiene_habitacional,
              ds.periodicidade_higiene_habitacional,
              ds.vezes_higiene_habitacional,
              ds.refeicoes,
              ds.periodicidade_refeicoes,
              ds.vezes_refeicoes,
              ds.tratamento_roupa,
              ds.periodicidade_tratamento_roupa,
              ds.vezes_tratamento_roupa
       FROM inscricoes i
       JOIN pessoas p ON p.id = i.pessoa_id
       LEFT JOIN contactos_emergencia ce ON ce.pessoa_id = p.id
       LEFT JOIN detalhes_sad ds ON ds.inscricao_id = i.id
       WHERE i.servico = 'SAD' AND ${filter}
       ORDER BY i.data_inscricao DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições SAD:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// LISTAGEM - CRECHE
router.get("/creche", async (req, res) => {
  try {
    const { lido } = req.query;
    const filter = buildLidoFilter(lido);
    const [rows] = await pool.query(
      `SELECT i.id,
              i.lido,
              i.lido_em,
              i.data_inscricao AS criado_em,
              i.origem_submissao,
              i.secao_personalizada_id,
              i.formulario_escolhido,
              i.creche_opcao,
              i.creche_item_id,
              p.nome_completo,
              p.data_nascimento,
              p.morada_completa AS morada,
              p.codigo_postal,
              p.localidade,
              p.cc_bi_numero,
              p.nif,
              p.niss,
              p.numero_utente,
              dc.crianca_nasceu,
              dc.data_prevista,
              dc.irmaos_frequentam,
              dc.necessita_apoio,
              dc.apoio_especificacao,
              dc.mae_nome,
              dc.mae_profissao,
              dc.mae_local_emprego,
              dc.mae_morada,
              dc.mae_codigo_postal,
              dc.mae_localidade,
              dc.mae_telemovel,
              dc.mae_email,
              dc.pai_nome,
              dc.pai_profissao,
              dc.pai_local_emprego,
              dc.pai_morada,
              dc.pai_codigo_postal,
              dc.pai_localidade,
              dc.pai_telemovel,
              dc.pai_email
       FROM inscricoes i
       JOIN pessoas p ON p.id = i.pessoa_id
       LEFT JOIN detalhes_creche dc ON dc.inscricao_id = i.id
       WHERE i.servico = 'CRECHE' AND ${filter}
       ORDER BY i.data_inscricao DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erro ao listar inscrições Creche:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// POST ERPI
router.post(
  "/erpi",
  [
    body("nome_completo").notEmpty(),
    body("data_nascimento").notEmpty(),
    body("morada_completa").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("contacto_email").isEmail(),
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
  localidade,
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

      await withTransaction(async (client) => {
        const localidadeVal = localidade || concelho || "";

        const pessoa = await client.query(
          `INSERT INTO pessoas (nome_completo, data_nascimento, cc_bi_numero, nif, niss, numero_utente, morada_completa, codigo_postal, localidade, concelho, distrito)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING id`,
          [
            nome_completo,
            data_nascimento,
            cc_bi_numero || null,
            nif || null,
            niss || null,
            numero_utente || null,
            morada_completa,
            codigo_postal,
            localidadeVal,
            concelho || null,
            distrito || null,
          ]
        );

        const pessoaId = pessoa.rows[0].id;

        await client.query(
          `INSERT INTO contactos_emergencia (pessoa_id, nome, telefone, email, parentesco)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            pessoaId,
            contacto_nome_completo,
            contacto_telefone,
            contacto_email,
            contacto_parentesco,
          ]
        );

        await client.query(
          `INSERT INTO inscricoes (pessoa_id, servico, observacoes, origem_submissao, secao_personalizada_id, formulario_escolhido, lido)
           VALUES ($1,'ERPI',$2,$3,$4,$5,false)`,
          [
            pessoaId,
            observacoes || null,
            req.body.origem_submissao || null,
            req.body.secao_personalizada_id || null,
            req.body.formulario_escolhido || null,
          ]
        );
      });

      res.status(201).json({ success: true, message: "Inscrição ERPI recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição ERPI:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// POST CENTRO DE DIA
router.post(
  "/centro-de-dia",
  [
    body("nome_completo").notEmpty(),
    body("data_nascimento").notEmpty(),
    body("morada_completa").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("contacto_email").isEmail(),
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
  localidade,
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

      await withTransaction(async (client) => {
        const localidadeVal = localidade || concelho || "";

        const pessoa = await client.query(
          `INSERT INTO pessoas (nome_completo, data_nascimento, cc_bi_numero, nif, niss, numero_utente, morada_completa, codigo_postal, localidade, concelho, distrito)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING id`,
          [
            nome_completo,
            data_nascimento,
            cc_bi_numero || null,
            nif || null,
            niss || null,
            numero_utente || null,
            morada_completa,
            codigo_postal,
            localidadeVal,
            concelho || null,
            distrito || null,
          ]
        );

        const pessoaId = pessoa.rows[0].id;

        await client.query(
          `INSERT INTO contactos_emergencia (pessoa_id, nome, telefone, email, parentesco)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            pessoaId,
            contacto_nome_completo,
            contacto_telefone,
            contacto_email,
            contacto_parentesco,
          ]
        );

        await client.query(
          `INSERT INTO inscricoes (pessoa_id, servico, observacoes, origem_submissao, secao_personalizada_id, formulario_escolhido, lido)
           VALUES ($1,'CENTRO_DIA',$2,$3,$4,$5,false)`,
          [
            pessoaId,
            observacoes || null,
            req.body.origem_submissao || null,
            req.body.secao_personalizada_id || null,
            req.body.formulario_escolhido || null,
          ]
        );
      });

      res.status(201).json({ success: true, message: "Inscrição Centro de Dia recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição Centro de Dia:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// POST SAD
router.post(
  "/sad",
  [
    body("nome_completo").notEmpty(),
    body("data_nascimento").notEmpty(),
    body("morada_completa").notEmpty(),
    body("codigo_postal").notEmpty(),
    body("contacto_email").isEmail(),
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
  localidade,
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

      await withTransaction(async (client) => {
        const localidadeVal = localidade || concelho || "";

        const pessoa = await client.query(
          `INSERT INTO pessoas (nome_completo, data_nascimento, cc_bi_numero, nif, niss, numero_utente, morada_completa, codigo_postal, localidade, concelho, distrito)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING id`,
          [
            nome_completo,
            data_nascimento,
            cc_bi_numero || null,
            nif || null,
            niss || null,
            numero_utente || null,
            morada_completa,
            codigo_postal,
            localidadeVal,
            concelho || null,
            distrito || null,
          ]
        );

        const pessoaId = pessoa.rows[0].id;

        await client.query(
          `INSERT INTO contactos_emergencia (pessoa_id, nome, telefone, email, parentesco)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            pessoaId,
            contacto_nome_completo,
            contacto_telefone,
            contacto_email,
            contacto_parentesco,
          ]
        );

        const inscr = await client.query(
          `INSERT INTO inscricoes (pessoa_id, servico, observacoes, origem_submissao, secao_personalizada_id, formulario_escolhido, lido)
           VALUES ($1,'SAD',$2,$3,$4,$5,false)
           RETURNING id`,
          [
            pessoaId,
            observacoes || null,
            req.body.origem_submissao || null,
            req.body.secao_personalizada_id || null,
            req.body.formulario_escolhido || null,
          ]
        );

        const inscId = inscr.rows[0].id;

        await client.query(
          `INSERT INTO detalhes_sad (
            inscricao_id,
            higiene_pessoal,
            periodicidade_higiene_pessoal,
            vezes_higiene_pessoal,
            higiene_habitacional,
            periodicidade_higiene_habitacional,
            vezes_higiene_habitacional,
            refeicoes,
            periodicidade_refeicoes,
            vezes_refeicoes,
            tratamento_roupa,
            periodicidade_tratamento_roupa,
            vezes_tratamento_roupa
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            inscId,
            Boolean(higiene_pessoal),
            periodicidade_higiene_pessoal || null,
            vezes_higiene_pessoal || null,
            Boolean(higiene_habitacional),
            periodicidade_higiene_habitacional || null,
            vezes_higiene_habitacional || null,
            Boolean(refeicoes),
            periodicidade_refeicoes || null,
            vezes_refeicoes || null,
            Boolean(tratamento_roupa),
            periodicidade_tratamento_roupa || null,
            vezes_tratamento_roupa || null,
          ]
        );
      });

      res.status(201).json({ success: true, message: "Inscrição SAD recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição SAD:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// POST CRECHE
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

      await withTransaction(async (client) => {
        const pessoa = await client.query(
          `INSERT INTO pessoas (nome_completo, data_nascimento, cc_bi_numero, nif, niss, numero_utente, morada_completa, codigo_postal, localidade)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING id`,
          [
            nome_completo,
            String(crianca_nasceu) === "true" ? data_nascimento : null,
            cc_bi_numero || null,
            nif || null,
            niss || null,
            numero_utente || null,
            morada,
            codigo_postal,
            localidade,
          ]
        );

        const pessoaId = pessoa.rows[0].id;

        const insc = await client.query(
          `INSERT INTO inscricoes (pessoa_id, servico, origem_submissao, secao_personalizada_id, formulario_escolhido, creche_opcao, creche_item_id, lido)
           VALUES ($1,'CRECHE',$2,$3,$4,$5,$6,false)
           RETURNING id`,
          [
            pessoaId,
            req.body.origem_submissao || null,
            req.body.secao_personalizada_id || null,
            req.body.formulario_escolhido || null,
            creche_opcao || null,
            creche_item_id ? Number(creche_item_id) : null,
          ]
        );

        const inscId = insc.rows[0].id;

        await client.query(
          `INSERT INTO detalhes_creche (
            inscricao_id,
            crianca_nasceu,
            data_prevista,
            irmaos_frequentam,
            necessita_apoio,
            apoio_especificacao,
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
            pai_email
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
          [
            inscId,
            String(crianca_nasceu) === "true",
            String(crianca_nasceu) === "true" ? null : data_prevista,
            typeof irmaos_frequentam !== "undefined"
              ? String(irmaos_frequentam) === "true"
              : null,
            typeof necessita_apoio !== "undefined"
              ? String(necessita_apoio) === "true"
              : null,
            apoio_especificacao || null,
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
          ]
        );
      });

      res.status(201).json({ success: true, message: "Inscrição Creche recebida." });
    } catch (error) {
      console.error("Erro ao guardar inscrição Creche:", error);
      res.status(500).json({ success: false, message: "Erro no servidor." });
    }
  }
);

// MARCAR COMO LIDO (todas usam inscricoes)
router.put(["/erpi/:id/read", "/centro-de-dia/:id/read", "/sad/:id/read", "/creche/:id/read"], async (req, res) => {
  try {
    await pool.query(`UPDATE inscricoes SET lido = true, lido_em = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar inscrição como lida:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

// DELETE genérico: remove inscrição e, se não houver mais inscrições da pessoa, remove pessoa/contatos
router.delete(["/erpi/:id", "/centro-de-dia/:id", "/sad/:id", "/creche/:id"], async (req, res) => {
  const id = req.params.id;
  try {
    await withTransaction(async (client) => {
      const insc = await client.query(`DELETE FROM inscricoes WHERE id = $1 RETURNING pessoa_id`, [id]);
      const pessoaId = insc.rows[0]?.pessoa_id;
      if (!pessoaId) return;

      const remaining = await client.query(`SELECT 1 FROM inscricoes WHERE pessoa_id = $1 LIMIT 1`, [pessoaId]);
      if (remaining.rowCount === 0) {
        await client.query(`DELETE FROM contactos_emergencia WHERE pessoa_id = $1`, [pessoaId]);
        await client.query(`DELETE FROM pessoas WHERE id = $1`, [pessoaId]);
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar inscrição:", error);
    res.status(500).json({ success: false, message: "Erro no servidor." });
  }
});

module.exports = router;