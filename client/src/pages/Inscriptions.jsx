import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Inscriptions.css";

const FORM_ENDPOINTS = {
  erpi: "/forms/erpi",
  centro_de_dia: "/forms/centro-de-dia",
  sad: "/forms/sad",
  creche: "/forms/creche",
};

const FORM_LABELS = {
  erpi: "ERPI",
  centro_de_dia: "Centro de Dia",
  sad: "SAD",
  creche: "Creche",
};

const Inscriptions = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("erpi");
  const [itemsByType, setItemsByType] = useState({ erpi: [], centro_de_dia: [], sad: [], creche: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const dispatchUnread = (list) => {
    const unread = list.filter((it) => !it.lido).length;
    try {
      const ev = new CustomEvent("inscricoes:updated", {
        detail: { unread },
      });
      window.dispatchEvent(ev);
    } catch (e) {
      // ignore
    }
  };

  const fetchUnreadTotals = useCallback(async () => {
    try {
      let total = 0;
      for (const type of Object.keys(FORM_ENDPOINTS)) {
        const resp = await api.get(`${FORM_ENDPOINTS[type]}?lido=false`);
        if (resp.data?.success) total += (resp.data.data || []).length;
      }
      const ev = new CustomEvent("inscricoes:updated", {
        detail: { unread: total },
      });
      window.dispatchEvent(ev);
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchItems = useCallback(async (type = selectedType) => {
    try {
      setLoading(true);
      const endpoint = FORM_ENDPOINTS[type];
      const resp = await api.get(endpoint);
      if (resp.data?.success) {
        const data = resp.data.data || [];
        const sorted = data.sort(
          (a, b) =>
            new Date(b.criado_em || b.created_at || 0) -
            new Date(a.criado_em || a.created_at || 0)
        );
        setItemsByType((prev) => ({ ...prev, [type]: sorted }));
        dispatchUnread(sorted);
      }
      await fetchUnreadTotals();
    } catch (error) {
      console.error("Erro ao carregar inscrições:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadTotals, selectedType]);

  useEffect(() => {
    fetchItems(selectedType);
  }, [fetchItems, selectedType]);

  const openInscription = async (it) => {
    setSelected(it);
    const list = itemsByType[selectedType] || [];
    // marcar como lido localmente
    const updatedList = list.map((row) =>
      row.id === it.id ? { ...row, lido: true } : row
    );
    setItemsByType((prev) => ({ ...prev, [selectedType]: updatedList }));
    dispatchUnread(updatedList);
    try {
      await api.put(`${FORM_ENDPOINTS[selectedType]}/${it.id}/read`);
    } catch (e) {
      // revert if failed
      setItemsByType((prev) => {
        const reverted = (prev[selectedType] || []).map((row) =>
          row.id === it.id ? { ...row, lido: it.lido } : row
        );
        dispatchUnread(reverted);
        return { ...prev, [selectedType]: reverted };
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar esta inscrição?")) return;
    try {
      await api.delete(`${FORM_ENDPOINTS[selectedType]}/${id}`);
      const updated = (itemsByType[selectedType] || []).filter(
        (row) => row.id !== id
      );
      setItemsByType((prev) => ({ ...prev, [selectedType]: updated }));
      dispatchUnread(updated);
      await fetchUnreadTotals();
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      console.error("Erro ao eliminar inscrição:", e);
      alert("Não foi possível eliminar.");
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("pt-PT") : "(sem data)";

  const formatDateOnly = (d) => {
    if (!d) return "(não indicado)";
    // handle plain date (YYYY-MM-DD) without timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return new Date(`${d}T00:00:00`).toLocaleDateString("pt-PT");
    }
    const dt = new Date(d);
    if (Number.isNaN(dt)) return d;
    return dt.toLocaleDateString("pt-PT");
  };

  const items = itemsByType[selectedType] || [];
  const unreadCount = items.filter((it) => !it.lido).length;

  return (
    <div className="inscriptions-page">
      <button className="btn-back" onClick={() => navigate("/dashboard")}>← Voltar</button>

      <div className="inscriptions-header">
        <h2>
          Inscrições {FORM_LABELS[selectedType]} ({items.length})
          {unreadCount > 0 && (
            <span className="badge-dot" title="Novas inscrições" />
          )}
        </h2>
        <div className="inscriptions-actions">
          <div className="inscriptions-options">
            {Object.keys(FORM_ENDPOINTS).map((type) => (
              <label
                key={type}
                className={`form-option-card ${selectedType === type ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="insc-type"
                  value={type}
                  checked={selectedType === type}
                  onChange={() => {
                    setSelected(null);
                    setSelectedType(type);
                  }}
                />
                {FORM_LABELS[type]}
              </label>
            ))}
          </div>
          <button onClick={fetchItems} className="btn-refresh">
            🔄 Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <p>A carregar inscrições...</p>
      ) : items.length === 0 ? (
        <p>Sem inscrições submetidas.</p>
      ) : (
        <div className="inscriptions-table-wrapper">
          <table className="inscriptions-table">
            <thead>
              {selectedType === "creche" ? (
                <tr>
                  <th>Nome</th>
                  <th>Creche</th>
                  <th>NIF</th>
                  <th>Localidade</th>
                  <th>Contacto</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              ) : (
                <tr>
                  <th>Nome</th>
                  <th>NIF</th>
                  <th>Contacto</th>
                  <th>Concelho</th>
                  <th>Distrito</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              )}
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className={it.lido ? "" : "unread"}>
                  <td>{it.nome_completo}</td>
                  {selectedType === "creche" ? (
                    <>
                      <td>{it.creche_opcao || "(não indicado)"}</td>
                      <td>{it.nif || ""}</td>
                      <td>{it.localidade || ""}</td>
                      <td>
                        {it.mae_telemovel || it.pai_telemovel || it.mae_email || it.pai_email || ""}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{it.nif}</td>
                      <td>
                        {it.contacto_nome_completo}
                        <br />
                        {it.contacto_telefone}
                      </td>
                      <td>{it.concelho}</td>
                      <td>{it.distrito}</td>
                    </>
                  )}
                  <td>{formatDate(it.criado_em || it.created_at)}</td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => openInscription(it)}
                    >
                      Ver
                    </button>
                    <button
                      className="btn-small btn-delete"
                      onClick={() => handleDelete(it.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="inscription-modal" onClick={() => setSelected(null)}>
          <div
            className="inscription-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selected.nome_completo}</h3>
            {selectedType === "creche" ? (
              <>
                <p><strong>Creche:</strong> {selected.creche_opcao || "(não indicado)"}</p>
                <p><strong>Criança já nasceu?</strong> {selected.crianca_nasceu ? "Sim" : "Não"}</p>
                {selected.crianca_nasceu ? (
                  <p><strong>Data de nascimento:</strong> {formatDateOnly(selected.data_nascimento)}</p>
                ) : (
                  <p><strong>Data prevista:</strong> {formatDateOnly(selected.data_prevista)}</p>
                )}
                <hr />
                <p><strong>Morada:</strong> {selected.morada}</p>
                <p><strong>Código Postal:</strong> {selected.codigo_postal}</p>
                <p><strong>Localidade:</strong> {selected.localidade}</p>
                <p><strong>CC/BI Nº:</strong> {selected.cc_bi_numero}</p>
                <p><strong>NIF:</strong> {selected.nif}</p>
                <p><strong>NISS:</strong> {selected.niss}</p>
                <p><strong>Nº Utente:</strong> {selected.numero_utente}</p>
                <hr />
                <h4>Mãe</h4>
                <p><strong>Nome:</strong> {selected.mae_nome}</p>
                <p><strong>Profissão:</strong> {selected.mae_profissao}</p>
                <p><strong>Local de emprego:</strong> {selected.mae_local_emprego}</p>
                <p><strong>Morada:</strong> {selected.mae_morada}</p>
                <p><strong>Código Postal:</strong> {selected.mae_codigo_postal}</p>
                <p><strong>Localidade:</strong> {selected.mae_localidade}</p>
                <p><strong>Telemóvel:</strong> {selected.mae_telemovel}</p>
                <p><strong>Email:</strong> {selected.mae_email}</p>
                <hr />
                <h4>Pai</h4>
                <p><strong>Nome:</strong> {selected.pai_nome}</p>
                <p><strong>Profissão:</strong> {selected.pai_profissao}</p>
                <p><strong>Local de emprego:</strong> {selected.pai_local_emprego}</p>
                <p><strong>Morada:</strong> {selected.pai_morada}</p>
                <p><strong>Código Postal:</strong> {selected.pai_codigo_postal}</p>
                <p><strong>Localidade:</strong> {selected.pai_localidade}</p>
                <p><strong>Telemóvel:</strong> {selected.pai_telemovel}</p>
                <p><strong>Email:</strong> {selected.pai_email}</p>
                <hr />
                <p><strong>Irmãos a frequentar:</strong> {selected.irmaos_frequentam ? "Sim" : "Não"}</p>
                <p><strong>Necessita apoio especial:</strong> {selected.necessita_apoio ? "Sim" : "Não"}</p>
                {selected.necessita_apoio && (
                  <p><strong>Apoio especificação:</strong> {selected.apoio_especificacao}</p>
                )}
              </>
            ) : (
              <>
                <p><strong>Data de nascimento:</strong> {formatDateOnly(selected.data_nascimento)}</p>
                <p><strong>Morada:</strong> {selected.morada_completa}</p>
                <p><strong>Código Postal:</strong> {selected.codigo_postal}</p>
                <p><strong>Concelho:</strong> {selected.concelho}</p>
                <p><strong>Distrito:</strong> {selected.distrito}</p>
                <p><strong>CC/BI Nº:</strong> {selected.cc_bi_numero}</p>
                <p><strong>NIF:</strong> {selected.nif}</p>
                <p><strong>NISS:</strong> {selected.niss}</p>
                <p><strong>Nº Utente:</strong> {selected.numero_utente}</p>
                <hr />
                <p><strong>Contacto:</strong> {selected.contacto_nome_completo}</p>
                <p><strong>Telefone:</strong> {selected.contacto_telefone}</p>
                <p><strong>Email:</strong> {selected.contacto_email}</p>
                <p><strong>Parentesco:</strong> {selected.contacto_parentesco}</p>
                {selectedType === "sad" && (
                  <>
                    <hr />
                    <p><strong>Higiene pessoal:</strong> {selected.higiene_pessoal ? "Sim" : "Não"}</p>
                    {selected.higiene_pessoal && (
                      <p>
                        <strong> • Periodicidade / vezes:</strong> {selected.periodicidade_higiene_pessoal || "(não indicado)"} — {selected.vezes_higiene_pessoal || "(não indicado)"}
                      </p>
                    )}
                    <p><strong>Higiene habitacional:</strong> {selected.higiene_habitacional ? "Sim" : "Não"}</p>
                    {selected.higiene_habitacional && (
                      <p>
                        <strong> • Periodicidade / vezes:</strong> {selected.periodicidade_higiene_habitacional || "(não indicado)"} — {selected.vezes_higiene_habitacional || "(não indicado)"}
                      </p>
                    )}
                    <p><strong>Refeições:</strong> {selected.refeicoes ? "Sim" : "Não"}</p>
                    {selected.refeicoes && (
                      <p>
                        <strong> • Periodicidade / vezes:</strong> {selected.periodicidade_refeicoes || "(não indicado)"} — {selected.vezes_refeicoes || "(não indicado)"}
                      </p>
                    )}
                    <p><strong>Tratamento de roupa:</strong> {selected.tratamento_roupa ? "Sim" : "Não"}</p>
                    {selected.tratamento_roupa && (
                      <p>
                        <strong> • Periodicidade / vezes:</strong> {selected.periodicidade_tratamento_roupa || "(não indicado)"} — {selected.vezes_tratamento_roupa || "(não indicado)"}
                      </p>
                    )}
                  </>
                )}
                {selected.observacoes && (
                  <>
                    <hr />
                    <p><strong>Observações:</strong></p>
                    <div className="obs-box">{selected.observacoes}</div>
                  </>
                )}
              </>
            )}
            <div className="modal-actions">
              <button
                className="btn-delete"
                onClick={() => handleDelete(selected.id)}
              >
                Eliminar
              </button>
              <button className="btn-cancel" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscriptions;
