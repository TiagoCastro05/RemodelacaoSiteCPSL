import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import useConfirm from "../hooks/useConfirm";
import "../styles/ProjectsManagement.css";
import "../styles/TransparencyManagement.css";

// Base URL para abrir ficheiros (sem sufixo /api)
const API_BASE = (
  process.env.REACT_APP_API_URL || "http://localhost:4000/api"
).replace(/\/?api$/, "");

// Modelo base do formulario
const defaultForm = {
  titulo: "",
  descricao: "",
  ano: new Date().getFullYear().toString(),
  tipo: "Relatorio",
  ficheiro: null,
};

// Pagina de gestao de documentos de transparencia
const TransparencyManagement = () => {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchDocumentos();
  }, []);

  // Carrega documentos do backend
  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/transparencia");
      if (data.success) {
        setDocumentos(data.data || []);
      }
    } catch (err) {
      setError("Erro ao carregar documentos de transparência.");
    } finally {
      setLoading(false);
    }
  };

  // Normaliza URL de ficheiro (absoluta ou relativa)
  const normalizeFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  // Atualiza estado do formulario (inclui ficheiro)
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "ficheiro") {
      setFormData((prev) => ({ ...prev, ficheiro: files?.[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Cria/atualiza documento
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.titulo.trim() || !formData.ano) {
      setError("Preencha pelo menos o título e o ano.");
      return;
    }

    if (!editingDoc && !formData.ficheiro) {
      setError("Selecione um ficheiro PDF para adicionar.");
      return;
    }

    const payload = new FormData();
    payload.append("titulo", formData.titulo.trim());
    payload.append("ano", formData.ano);
    if (formData.ficheiro) payload.append("ficheiro", formData.ficheiro);
    if (formData.descricao.trim())
      payload.append("descricao", formData.descricao.trim());
    if (formData.tipo) payload.append("tipo", formData.tipo);

    try {
      setSubmitting(true);
      const endpoint = editingDoc
        ? `/transparencia/${editingDoc.id}`
        : "/transparencia";
      const method = editingDoc ? "put" : "post";

      await api[method](endpoint, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(
        editingDoc
          ? "Documento atualizado com sucesso!"
          : "Documento adicionado com sucesso!",
      );
      setFormData((prev) => ({ ...defaultForm, ano: prev.ano }));
      setEditingDoc(null);
      setShowModal(false);
      await fetchDocumentos();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      const message =
        err.response?.data?.message || "Erro ao enviar documento.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Elimina documento
  const handleDelete = async (id) => {
    const confirmed = await confirm(
      "Tem certeza que deseja eliminar este documento?",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/transparencia/${id}`);
      setSuccess("Documento eliminado com sucesso!");
      await fetchDocumentos();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError("Erro ao eliminar documento.");
    }
  };

  // Abre modal para novo documento
  const openCreate = () => {
    setEditingDoc(null);
    setFormData({ ...defaultForm });
    setShowModal(true);
  };

  // Abre modal para editar documento
  const openEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      titulo: doc.titulo || "",
      descricao: doc.descricao || "",
      ano: (doc.ano || "").toString(),
      tipo: doc.tipo || "Relatorio",
      ficheiro: null,
    });
    setShowModal(true);
  };

  return (
    <div className="projects-management transparency-page">
      <button className="btn-back" onClick={() => navigate("/dashboard")}>
        ← Voltar
      </button>

      <div className="section-header">
        <div>
          <h2>Transparência</h2>
          <p className="section-description">
            Carregue relatórios e documentos oficiais em PDF. Só Administradores
            e Gestores podem adicionar, editar ou eliminar ficheiros.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Adicionar documento
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card list-card">
        <div className="card-header">
          <h3>📑 Documentos existentes</h3>
          <p>Veja, abra, edite ou elimine documentos já publicados.</p>
        </div>

        {loading ? (
          <div className="loading">A carregar documentos...</div>
        ) : documentos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum documento carregado ainda.</p>
            <small>
              Os ficheiros enviados aparecem aqui com link direto para
              visualização.
            </small>
          </div>
        ) : (
          <div className="docs-list">
            {documentos.map((doc) => (
              <div key={doc.id} className="doc-row">
                <div className="doc-info">
                  <div className="doc-title">
                    <span className="doc-icon">📄</span>
                    <div>
                      <h4>{doc.titulo}</h4>
                      <div className="doc-meta">
                        <span className="pill">Ano {doc.ano}</span>
                        {doc.tipo && (
                          <span className="pill pill-neutral">{doc.tipo}</span>
                        )}
                        {doc.tamanho_ficheiro && (
                          <span className="pill pill-muted">
                            {doc.tamanho_ficheiro}
                          </span>
                        )}
                      </div>
                      {doc.descricao && (
                        <p className="doc-description">{doc.descricao}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="doc-actions">
                  <a
                    className="btn-icon btn-link"
                    href={normalizeFileUrl(doc.ficheiro_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir ficheiro"
                  >
                    🔗
                  </a>
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => openEdit(doc)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(doc.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDoc ? "Editar documento" : "Adicionar documento"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form className="transparency-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="titulo">Título *</label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Relatório e Contas 2023"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ano">Ano *</label>
                  <input
                    type="number"
                    id="ano"
                    name="ano"
                    min="2000"
                    max="2100"
                    value={formData.ano}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tipo">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                  >
                    <option value="Relatorio">Relatório & Contas</option>
                    <option value="Contas">Contas</option>
                    <option value="Relatorio_Atividades">
                      Relatório de Atividades
                    </option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição (opcional)</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows="3"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Notas ou breve resumo do documento"
                />
              </div>

              <div className="form-group file-input">
                <label htmlFor="ficheiro">
                  {editingDoc ? "Substituir ficheiro (PDF)" : "Ficheiro PDF *"}
                </label>
                <input
                  type="file"
                  id="ficheiro"
                  name="ficheiro"
                  accept="application/pdf"
                  onChange={handleChange}
                  required={!editingDoc}
                />
                {formData.ficheiro && (
                  <p className="file-name">
                    Selecionado: {formData.ficheiro.name}
                  </p>
                )}
                {editingDoc && !formData.ficheiro && (
                  <p className="file-name">A manter ficheiro atual</p>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "A guardar..."
                    : editingDoc
                      ? "Atualizar documento"
                      : "Guardar documento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default TransparencyManagement;
