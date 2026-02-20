import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirm from "../hooks/useConfirm";
import "../styles/Messages.css";

// Pagina de gestao de mensagens do formulario
const Messages = () => {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [sortConfig, setSortConfig] = useState({
    key: "data",
    direction: "desc",
  });
  const { confirm, dialogProps } = useConfirm();

  // Carrega mensagens da API (com dedupe local)
  const fetchMensagens = async () => {
    try {
      setLoading(true);
      const resp = await api.get("/mensagens");
      if (resp.data && resp.data.success) {
        // dedupe by content signature (nome|email|assunto|mensagem) to avoid showing duplicate submissions
        const raw = resp.data.data || [];
        const map = new Map();
        raw.forEach((it) => {
          if (!it) return;
          const key = `${it.nome || ""}|${it.email || ""}|${it.assunto || ""}|${
            it.mensagem || ""
          }`;
          // keep the first occurrence (or you could keep the latest by timestamp)
          if (!map.has(key)) map.set(key, it);
        });
        const unique = Array.from(map.values()).sort((a, b) => {
          const ta = new Date(a.data_submissao || a.created_at || 0).getTime();
          const tb = new Date(b.data_submissao || b.created_at || 0).getTime();
          return tb - ta;
        });
        setMensagens(unique);
        // also dispatch exact server unread count (before dedupe) so other components can rely on server truth
        try {
          const rawUnread = (resp.data.data || []).filter(
            (it) => !it.respondido,
          ).length;
          const evServer = new CustomEvent("mensagens:server", {
            detail: { unread: rawUnread },
          });
          window.dispatchEvent(evServer);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMensagens();
  }, []);

  // Abre mensagem e marca como lida
  const openMessage = async (m) => {
    try {
      const resp = await api.get(`/mensagens/${m.id}`);
      if (resp.data && resp.data.success) {
        setSelected(resp.data.data);
        // optimistically mark as read in UI so header count updates immediately
        setMensagens((prev) =>
          prev.map((it) =>
            it.id === resp.data.data.id ? { ...it, respondido: true } : it,
          ),
        );
        markRead(resp.data.data.id);
      } else {
        setSelected(m);
        setMensagens((prev) =>
          prev.map((it) => (it.id === m.id ? { ...it, respondido: true } : it)),
        );
        markRead(m.id);
      }
    } catch (err) {
      console.error("Erro ao obter mensagem:", err);
      setSelected(m);
      setMensagens((prev) =>
        prev.map((it) => (it.id === m.id ? { ...it, respondido: true } : it)),
      );
      markRead(m.id);
    }
  };

  // Marca mensagem como lida no servidor
  const markRead = async (id) => {
    try {
      await api.put(`/mensagens/${id}/read`);
      // successful on server; we've already optimistically updated local state in openMessage
      if (selected && selected.id === id)
        setSelected({ ...selected, respondido: true });
    } catch (err) {
      // revert optimistic update if server fails
      setMensagens((prev) =>
        prev.map((it) => (it.id === id ? { ...it, respondido: false } : it)),
      );
      console.error(err);
    }
  };

  // Elimina mensagem selecionada
  const handleDelete = async (id) => {
    const confirmed = await confirm(
      "Tem certeza que deseja eliminar esta mensagem?",
    );
    if (!confirmed) return;
    try {
      await api.delete(`/mensagens/${id}`);
      // remove locally immediately so UI updates without full refresh
      setMensagens((prev) => prev.filter((it) => it.id !== id));
      if (selected && selected.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  // reply feature temporarily removed per request

  const unreadCount = mensagens.filter((m) => !m.respondido).length;

  // Funcao para ordenar ao clicar no cabecalho
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filtrar e ordenar mensagens
  const filteredMensagens = mensagens
    .filter((m) => {
      const matchesSearch =
        m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.assunto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.mensagem?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "todas" ||
        (filterStatus === "novas" && !m.respondido) ||
        (filterStatus === "lidas" && m.respondido);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue, bValue;

      switch (sortConfig.key) {
        case "nome":
          aValue = (a.nome || "").toLowerCase();
          bValue = (b.nome || "").toLowerCase();
          break;
        case "email":
          aValue = (a.email || "").toLowerCase();
          bValue = (b.email || "").toLowerCase();
          break;
        case "assunto":
          aValue = (a.assunto || "").toLowerCase();
          bValue = (b.assunto || "").toLowerCase();
          break;
        case "data":
          aValue = new Date(a.data_submissao || a.created_at || 0).getTime();
          bValue = new Date(b.data_submissao || b.created_at || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  // notify other parts of the app (e.g., dashboard) about unread count changes
  useEffect(() => {
    try {
      const ev = new CustomEvent("mensagens:updated", {
        detail: { unread: unreadCount },
      });
      window.dispatchEvent(ev);
    } catch (e) {
      // ignore
    }
  }, [unreadCount]);

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h2>
          Mensagens ({filteredMensagens.length})
          {unreadCount > 0 && ` - ${unreadCount} novas`}
        </h2>
        <div className="dashboard-actions">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Voltar
          </button>
          <button onClick={fetchMensagens} className="btn-refresh">
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Pesquisar por nome, email, assunto ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todas">Todas as mensagens</option>
            <option value="novas">Não lidas</option>
            <option value="lidas">Lidas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>A carregar mensagens...</p>
      ) : filteredMensagens.length === 0 ? (
        <p>
          {searchTerm || filterStatus !== "todas"
            ? "Nenhuma mensagem encontrada."
            : "Sem mensagens."}
        </p>
      ) : (
        <div className="messages-table-wrapper">
          <table className="messages-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("nome")}
                  style={{ cursor: "pointer" }}
                >
                  Nome{" "}
                  {sortConfig.key === "nome" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th>E-mail</th>
                <th
                  onClick={() => handleSort("assunto")}
                  style={{ cursor: "pointer" }}
                >
                  Assunto{" "}
                  {sortConfig.key === "assunto" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("data")}
                  style={{ cursor: "pointer" }}
                >
                  Data{" "}
                  {sortConfig.key === "data" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredMensagens.map((m) => (
                <tr key={m.id} className={m.respondido ? "" : "unread"}>
                  <td
                    onClick={() => openMessage(m)}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>{m.nome}</strong>
                  </td>
                  <td
                    onClick={() => openMessage(m)}
                    style={{ cursor: "pointer" }}
                  >
                    {m.email}
                  </td>
                  <td
                    onClick={() => openMessage(m)}
                    style={{ cursor: "pointer" }}
                  >
                    {m.assunto}
                  </td>
                  <td
                    onClick={() => openMessage(m)}
                    style={{ cursor: "pointer" }}
                  >
                    {new Date(
                      m.data_submissao || m.created_at,
                    ).toLocaleDateString("pt-PT")}
                  </td>
                  <td>
                    <button
                      onClick={() => openMessage(m)}
                      className="btn-small"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="btn-small btn-delete"
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
        <div className="message-modal" onClick={() => setSelected(null)}>
          <div
            className="message-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selected.assunto}</h3>
            <p>
              <strong>De:</strong> {selected.nome} • {selected.email}
            </p>
            <p>
              <strong>Data:</strong>{" "}
              {new Date(
                selected.data_submissao || selected.created_at,
              ).toLocaleString("pt-PT")}
            </p>
            <hr />
            <p>
              <strong>Mensagem:</strong>
            </p>
            <div className="message-body">
              <pre style={{ whiteSpace: "pre-wrap" }}>{selected.mensagem}</pre>
            </div>

            <div
              className="reply-actions"
              style={{ justifyContent: "flex-end", marginTop: 12 }}
            >
              {/* Only provide Fechar per request */}
              <button onClick={() => setSelected(null)} className="btn-cancel">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default Messages;
