import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/ProjectsManagement.css";

const ProjectsManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    imagem_destaque: "",
    url_externa: "",
    ativo: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/projetos");
      setProjects(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      setError("Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingProject) {
        // Atualizar projeto existente
        await api.put(`/projetos/${editingProject.id}`, formData);
        setSuccess("Projeto atualizado com sucesso!");
      } else {
        // Criar novo projeto
        await api.post("/projetos", formData);
        setSuccess("Projeto criado com sucesso!");
      }

      fetchProjects();
      resetForm();
      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 2000);
    } catch (error) {
      const message =
        error.response?.data?.message || "Erro ao salvar projeto.";
      setError(message);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      titulo: project.titulo,
      descricao: project.descricao,
      data_inicio: project.data_inicio?.split("T")[0] || "",
      data_fim: project.data_fim?.split("T")[0] || "",
      imagem_destaque: project.imagem_destaque || "",
      url_externa: project.url_externa || "",
      ativo: project.ativo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja eliminar este projeto?")) {
      return;
    }

    try {
      await api.delete(`/projetos/${id}`);
      setSuccess("Projeto eliminado com sucesso!");
      fetchProjects();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Erro ao eliminar projeto.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/projetos/${id}`, { ativo: !currentStatus });
      setSuccess(`Projeto ${!currentStatus ? "ativado" : "desativado"}!`);
      fetchProjects();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Erro ao alterar estado.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      titulo: "",
      descricao: "",
      data_inicio: "",
      data_fim: "",
      imagem_destaque: "",
      url_externa: "",
      ativo: true,
    });
  };

  const handleNewProject = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">A carregar projetos...</div>;
  }

  return (
    <div className="projects-management">
      <div className="section-header">
        <div>
          <h2>Projetos</h2>
          <p className="section-description">
            Gerencie os projetos que aparecem na seção "Projetos" do site
          </p>
        </div>
        <button className="btn-primary" onClick={handleNewProject}>
          + Novo Projeto
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="projects-preview">
        <div className="preview-header">
          <h3>📋 Pré-visualização da Seção</h3>
          <p>Como os visitantes veem no site</p>
        </div>

        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="no-projects">
              <p>Nenhum projeto criado ainda.</p>
              <button className="btn-primary" onClick={handleNewProject}>
                Criar Primeiro Projeto
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`project-card ${!project.ativo ? "inactive" : ""} ${
                  project.url_externa ? "clickable" : ""
                }`}
                onClick={() => {
                  if (project.url_externa) {
                    window.open(project.url_externa, "_blank");
                  }
                }}
                style={{ cursor: project.url_externa ? "pointer" : "default" }}
                title={
                  project.url_externa ? "Clique para visitar o projeto" : ""
                }
              >
                <div className="project-image">
                  {project.imagem_destaque ? (
                    <img
                      src={project.imagem_destaque}
                      alt={project.titulo}
                      onError={(e) => {
                          // inline SVG placeholder to avoid external network calls
                          e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect fill='#f6f7fb' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#888' font-size='18' font-family='Arial, sans-serif'>Sem Imagem</text></svg>")}`;
                        }}
                    />
                  ) : (
                    <div className="placeholder-image">
                      <span>📁 Sem imagem</span>
                    </div>
                  )}
                  {!project.ativo && (
                    <div className="inactive-overlay">
                      <span>INATIVO</span>
                    </div>
                  )}
                </div>

                <div className="project-content">
                  <h4>
                    {project.titulo}
                    {project.url_externa && (
                      <span className="link-indicator" title="Tem hiperligação">
                        🔗
                      </span>
                    )}
                  </h4>
                  <p className="project-description">{project.descricao}</p>
                  <div className="project-dates">
                    <span>
                      🗓️ Início:{" "}
                      {new Date(project.data_inicio).toLocaleDateString()}
                    </span>
                    {project.data_fim && (
                      <span>
                        🏁 Fim:{" "}
                        {new Date(project.data_fim).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="project-actions">
                  {project.url_externa && (
                    <a
                      href={project.url_externa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-icon btn-link"
                      onClick={(e) => e.stopPropagation()}
                      title="Visitar página do projeto"
                    >
                      🔗
                    </a>
                  )}
                  <button
                    className="btn-icon btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(project.id, project.ativo);
                    }}
                    title={project.ativo ? "Desativar" : "Ativar"}
                  >
                    {project.ativo ? "👁️" : "👁️‍🗨️"}
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProject ? "Editar Projeto" : "Novo Projeto"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-group">
                <label htmlFor="titulo">Título do Projeto *</label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Plataforma Elisa"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição *</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Descreva o projeto..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="data_inicio">Data de Início *</label>
                  <input
                    type="date"
                    id="data_inicio"
                    name="data_inicio"
                    value={formData.data_inicio}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="data_fim">Data de Fim (Opcional)</label>
                  <input
                    type="date"
                    id="data_fim"
                    name="data_fim"
                    value={formData.data_fim}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="imagem_destaque">URL da Imagem</label>
                <input
                  type="url"
                  id="imagem_destaque"
                  name="imagem_destaque"
                  value={formData.imagem_destaque}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                <small>
                  Cole o link de uma imagem ou deixe em branco para usar o
                  placeholder
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="url_externa">
                  🔗 Link do Projeto (Hiperligação)
                </label>
                <input
                  type="url"
                  id="url_externa"
                  name="url_externa"
                  value={formData.url_externa}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/projeto"
                />
                <small>
                  Ao clicar no projeto, o visitante será redirecionado para este
                  link (opcional)
                </small>
              </div>

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                  />
                  <span>Projeto ativo (visível no site)</span>
                </label>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingProject ? "Atualizar Projeto" : "Criar Projeto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManagement;
