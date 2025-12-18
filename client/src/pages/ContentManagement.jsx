import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/ContentManagement.css";

const ContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conteudo");
      setContents(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar conteúdo:", error);
      setError("Erro ao carregar conteúdo.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
  };

  const handleSave = async (contentId, updatedData) => {
    setError("");
    setSuccess("");

    try {
      await api.put(`/conteudo/${contentId}`, updatedData);
      setSuccess("Conteúdo atualizado com sucesso!");
      fetchContents();
      setEditingContent(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Erro ao atualizar conteúdo.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCancel = () => {
    setEditingContent(null);
  };

  if (loading) {
    return <div className="loading">A carregar conteúdo...</div>;
  }

  return (
    <div className="content-management">
      <div className="section-header">
        <div>
          <h2>Conteúdo Institucional</h2>
          <p className="section-description">
            Edite o conteúdo da seção "Instituição" que aparece no site
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="content-preview">
        <div className="preview-header">
          <h3>📄 Seção Instituição do Site</h3>
          <p>Clique em "Editar" para modificar qualquer parte</p>
        </div>

        <div className="content-sections">
          {contents.length === 0 ? (
            <div className="no-content">
              <p>Nenhum conteúdo encontrado.</p>
            </div>
          ) : (
            contents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                isEditing={editingContent?.id === content.id}
                onEdit={() => handleEdit(content)}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para cada card de conteúdo
const ContentCard = ({ content, isEditing, onEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    titulo: content.titulo || "",
    subtitulo: content.subtitulo || "",
    conteudo: content.conteudo || "",
    imagem: content.imagem || "",
    video_url: content.video_url || "",
    ativo: content.ativo,
  });

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(content.id, formData);
  };

  if (isEditing) {
    return (
      <div className="content-card editing">
        <form onSubmit={handleSubmit} className="content-form">
          <div className="form-header">
            <h4>✏️ Editando: {content.secao}</h4>
          </div>

          <div className="form-group">
            <label htmlFor="titulo">Título</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Título da seção"
            />
          </div>

          <div className="form-group">
            <label htmlFor="subtitulo">Subtítulo</label>
            <input
              type="text"
              id="subtitulo"
              name="subtitulo"
              value={formData.subtitulo}
              onChange={handleChange}
              placeholder="Subtítulo (opcional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="conteudo">Conteúdo</label>
            <textarea
              id="conteudo"
              name="conteudo"
              value={formData.conteudo}
              onChange={handleChange}
              placeholder="Texto principal..."
              rows="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="imagem">URL da Imagem</label>
            <input
              type="url"
              id="imagem"
              name="imagem"
              value={formData.imagem}
              onChange={handleChange}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="video_url">URL do Vídeo (YouTube, Vimeo)</label>
            <input
              type="url"
              id="video_url"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
              />
              <span>Conteúdo ativo (visível no site)</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              💾 Guardar Alterações
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`content-card ${!content.ativo ? "inactive" : ""}`}>
      <div className="content-header">
        <div>
          <span className="content-badge">{content.secao}</span>
          {!content.ativo && <span className="inactive-badge">Inativo</span>}
        </div>
        <button className="btn-icon btn-edit" onClick={onEdit} title="Editar">
          ✏️ Editar
        </button>
      </div>

      <div className="content-body">
        {content.titulo && <h3>{content.titulo}</h3>}
        {content.subtitulo && <h4>{content.subtitulo}</h4>}

        {content.imagem && (
          <div className="content-image">
            <img
              src={content.imagem}
              alt={content.titulo}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        {content.video_url && (
          <div className="content-video">
            <p>
              🎥 <strong>Vídeo:</strong> {content.video_url}
            </p>
          </div>
        )}

        {content.conteudo && (
          <div className="content-text">
            <p>{content.conteudo}</p>
          </div>
        )}

        {!content.titulo && !content.conteudo && (
          <p className="empty-content">
            Sem conteúdo definido. Clique em "Editar" para adicionar.
          </p>
        )}
      </div>

      <div className="content-footer">
        <small>
          Ordem: {content.ordem} | Atualizado em:{" "}
          {new Date(content.data_atualizacao).toLocaleString()}
        </small>
      </div>
    </div>
  );
};

export default ContentManagement;
