import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Messages.css";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [sortOrder, setSortOrder] = useState("recentes");

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
            (it) => !it.respondido
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

  const openMessage = async (m) => {
    try {
      const resp = await api.get(`/mensagens/${m.id}`);
      if (resp.data && resp.data.success) {
        setSelected(resp.data.data);
        // optimistically mark as read in UI so header count updates immediately
        setMensagens((prev) =>
          prev.map((it) =>
            it.id === resp.data.data.id ? { ...it, respondido: true } : it
          )
        );
        markRead(resp.data.data.id);
      } else {
        setSelected(m);
        setMensagens((prev) =>
          prev.map((it) => (it.id === m.id ? { ...it, respondido: true } : it))
        );
        markRead(m.id);
      }
    } catch (err) {
      console.error("Erro ao obter mensagem:", err);
      setSelected(m);
      setMensagens((prev) =>
        prev.map((it) => (it.id === m.id ? { ...it, respondido: true } : it))
      );
      markRead(m.id);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/mensagens/${id}/read`);
      // successful on server; we've already optimistically updated local state in openMessage
      if (selected && selected.id === id)
        setSelected({ ...selected, respondido: true });
    } catch (err) {
      // revert optimistic update if server fails
      setMensagens((prev) =>
        prev.map((it) => (it.id === id ? { ...it, respondido: false } : it))
      );
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta mensagem?"))
      return;
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
      const dateA = new Date(a.data_submissao || a.created_at || 0);
      const dateB = new Date(b.data_submissao || b.created_at || 0);
      if (sortOrder === "recentes") {
        return dateB - dateA;
      } else if (sortOrder === "antigas") {
        return dateA - dateB;
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
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
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
        <div className="messages-list">
          <ul>
            {filteredMensagens.map((m) => (
              <li
                key={m.id}
                className={`message-item ${m.respondido ? "read" : "unread"}`}
              >
                <div className="msg-left" onClick={() => openMessage(m)}>
                  <strong className="msg-name">{m.nome}</strong>
                  <div className="msg-subject">{m.assunto}</div>
                  <div className="msg-meta">
                    {m.email} •{" "}
                    {new Date(m.data_submissao || m.created_at).toLocaleString(
                      "pt-PT"
                    )}
                  </div>
                </div>
                <div className="msg-actions">
                  {/* keep only Ver and Eliminar per request */}
                  <button onClick={() => openMessage(m)} className="btn-small">
                    Ver
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="btn-small btn-delete"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
                selected.data_submissao || selected.created_at
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
    </div>
  );
};

export default Messages;
