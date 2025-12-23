import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";
import "../styles/Dashboard.css";

function CustomSectionsManagement() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [secoes, setSecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSecao, setEditingSecao] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    titulo: "",
    slug: "",
    descricao: "",
    icone: "📄",
    tipo_layout: "cards",
    tem_formulario: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchSecoes();
  }, [user, navigate]);

  const fetchSecoes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/secoes-personalizadas");
      if (response.data.success) {
        setSecoes(response.data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar seções:", error);
      alert("Erro ao carregar seções personalizadas.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (secao = null) => {
    if (secao) {
      setEditingSecao(secao);
      setFormData({
        nome: secao.nome,
        titulo: secao.titulo,
        slug: secao.slug,
        descricao: secao.descricao || "",
        icone: secao.icone || "📄",
        tipo_layout: secao.tipo_layout || "cards",
        tem_formulario: secao.tem_formulario || false,
      });
    } else {
      setEditingSecao(null);
      setFormData({
        nome: "",
        titulo: "",
        slug: "",
        descricao: "",
        icone: "📄",
        tipo_layout: "cards",
        tem_formulario: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSecao) {
        // Atualizar
        await api.put(`/secoes-personalizadas/${editingSecao.id}`, formData);
        alert("Seção atualizada com sucesso!");
      } else {
        // Criar
        await api.post("/secoes-personalizadas", formData);
        alert("Seção criada com sucesso!");
      }
      setShowModal(false);
      fetchSecoes();
    } catch (error) {
      console.error("Erro ao salvar seção:", error);
      alert(error.response?.data?.message || "Erro ao salvar seção.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta seção?")) {
      return;
    }
    try {
      await api.delete(`/secoes-personalizadas/${id}`);
      alert("Seção eliminada com sucesso!");
      fetchSecoes();
    } catch (error) {
      console.error("Erro ao eliminar seção:", error);
      alert("Erro ao eliminar seção.");
    }
  };

  const handleGenerateSlug = () => {
    const slug = formData.titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData({ ...formData, slug });
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <p>A carregar seções personalizadas...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Gerir Seções Personalizadas</h1>
        <div className="dashboard-actions">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Voltar
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            ➕ Nova Seção
          </button>
        </div>
      </div>

      {secoes.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma seção personalizada criada ainda.</p>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            Criar primeira seção
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Ícone</th>
                <th>Título</th>
                <th>Nome/Slug</th>
                <th>Layout</th>
                <th>Formulário</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {secoes.map((secao) => (
                <tr key={secao.id}>
                  <td>{secao.ordem}</td>
                  <td style={{ fontSize: "1.5em" }}>{secao.icone}</td>
                  <td>
                    <strong>{secao.titulo}</strong>
                  </td>
                  <td>
                    <code>{secao.nome}</code> / <code>#{secao.slug}</code>
                  </td>
                  <td>
                    <span className="badge">{secao.tipo_layout}</span>
                  </td>
                  <td>
                    {secao.tem_formulario ? (
                      <span className="badge badge-success">Sim</span>
                    ) : (
                      <span className="badge badge-secondary">Não</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleOpenModal(secao)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-view"
                        onClick={() =>
                          navigate(`/dashboard/secoes/${secao.id}/itens`)
                        }
                        title="Gerir conteúdo"
                      >
                        📝
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(secao.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="edit-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>{editingSecao ? "Editar Seção" : "Nova Seção"}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="edit-modal-body">
                <label>
                  <strong>Título (exibido no site):</strong>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    required
                    placeholder="Ex: Galeria de Fotos"
                  />
                </label>

                <label>
                  <strong>Nome interno:</strong>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                    placeholder="Ex: galeria (sem espaços)"
                    pattern="[a-z0-9-_]+"
                  />
                  <small className="hint">
                    Apenas letras minúsculas, números, - e _
                  </small>
                </label>

                <label>
                  <strong>Slug (âncora no site):</strong>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      required
                      placeholder="Ex: galeria"
                      pattern="[a-z0-9-]+"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleGenerateSlug}
                      title="Gerar slug a partir do título"
                    >
                      🔄 Gerar
                    </button>
                  </div>
                  <small className="hint">
                    Usado para âncora:{" "}
                    <code>#{formData.slug || "galeria"}</code>
                  </small>
                </label>

                <label>
                  <strong>Ícone:</strong>
                  <input
                    type="text"
                    value={formData.icone}
                    onChange={(e) =>
                      setFormData({ ...formData, icone: e.target.value })
                    }
                    placeholder="📸"
                    maxLength="10"
                  />
                  <small className="hint">
                    Emoji ou texto curto (ex: 📸, 👥, 🏆)
                  </small>
                </label>

                <label>
                  <strong>Descrição:</strong>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    rows="3"
                    placeholder="Descrição opcional da seção"
                  />
                </label>

                <label>
                  <strong>Tipo de Layout:</strong>
                  <select
                    value={formData.tipo_layout}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_layout: e.target.value })
                    }
                  >
                    <option value="cards">Cards (grade)</option>
                    <option value="lista">Lista</option>
                    <option value="galeria">Galeria de imagens</option>
                    <option value="texto">Texto corrido</option>
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.tem_formulario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tem_formulario: e.target.checked,
                      })
                    }
                  />
                  <strong>Incluir formulário de contacto</strong>
                </label>
              </div>
              <div className="edit-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingSecao ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomSectionsManagement;
