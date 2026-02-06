import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import api from "../services/api";
import "../styles/Dashboard.css";

const IMAGE_MAX_MB = 3;

const validateImageFile = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve({ ok: false, message: "Selecione uma imagem válida." });
      return;
    }
    if (!file.type?.startsWith("image/")) {
      resolve({
        ok: false,
        message: "Ficheiro inválido. Envie uma imagem (JPG/PNG).",
      });
      return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      resolve({
        ok: false,
        message: `A imagem excede ${IMAGE_MAX_MB} MB.`,
      });
      return;
    }
    resolve({ ok: true });
  });

function SectionItemsManagement() {
  const { secaoId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [secao, setSecao] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageWarning, setImageWarning] = useState("");
  const [formData, setFormData] = useState({
    titulo: "",
    subtitulo: "",
    conteudo: "",
    imagem: "",
    video_url: "",
    link_externo: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, secaoId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar dados da seção
      const secaoResponse = await api.get(`/secoes-personalizadas/${secaoId}`);
      if (secaoResponse.data.success) {
        setSecao(secaoResponse.data.data);
      }

      // Buscar itens da seção
      const itensResponse = await api.get(
        `/secoes-personalizadas/${secaoId}/itens`
      );
      if (itensResponse.data.success) {
        setItens(itensResponse.data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados da seção.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        titulo: item.titulo || "",
        subtitulo: item.subtitulo || "",
        conteudo: item.conteudo || "",
        imagem: item.imagem || "",
        video_url: item.video_url || "",
        link_externo: item.link_externo || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        titulo: "",
        subtitulo: "",
        conteudo: "",
        imagem: "",
        video_url: "",
        link_externo: "",
      });
    }
    setShowModal(true);
  };

  const uploadImage = async (file) => {
    try {
      const validation = await validateImageFile(file);
      if (!validation.ok) {
        setImageWarning(
          validation.message ||
            `A imagem deve ter no máximo ${IMAGE_MAX_MB} MB.`,
        );
        return;
      }
      setImageWarning("");

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("tabela_referencia", "itens_secoes_personalizadas");

      const response = await api.post("/media", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let url = response.data?.data?.url;
      if (url) {
        const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
        url = url.startsWith("http") ? url : `${base}${url}`;
        setFormData((d) => ({ ...d, imagem: url }));
      }
    } catch (err) {
      console.error("Erro ao enviar imagem:", err);
      alert("Erro ao enviar imagem.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Atualizar
        await api.put(
          `/secoes-personalizadas/${secaoId}/itens/${editingItem.id}`,
          formData
        );
        alert("Item atualizado com sucesso!");
      } else {
        // Criar
        await api.post(`/secoes-personalizadas/${secaoId}/itens`, formData);
        alert("Item criado com sucesso!");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao guardar item:", error);
      alert(error.response?.data?.message || "Erro ao guardar item.");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Tem certeza que deseja eliminar este item?")) {
      return;
    }
    try {
      await api.delete(`/secoes-personalizadas/${secaoId}/itens/${itemId}`);
      alert("Item eliminado com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Erro ao eliminar item:", error);
      alert("Erro ao eliminar item.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <p>A carregar itens...</p>
      </div>
    );
  }

  if (!secao) {
    return (
      <div className="dashboard-content">
        <p>Seção não encontrada.</p>
        <button
          className="btn-back"
          onClick={() => navigate("/dashboard/secoes")}
        >
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div>
          <h1>
            {secao.icone} {secao.titulo}
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Gerir conteúdo da seção · Layout:{" "}
            <strong>{secao.tipo_layout}</strong>
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-back"
            onClick={() => navigate("/dashboard/secoes")}
          >
            ← Voltar
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            ➕ Novo Item
          </button>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum item criado ainda para esta seção.</p>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            Criar primeiro item
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Imagem</th>
                <th>Título</th>
                <th>Subtítulo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td>{item.ordem}</td>
                  <td>
                    {item.imagem && (
                      <img
                        src={item.imagem}
                        alt={item.titulo}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                  </td>
                  <td>
                    <strong>{item.titulo || "Sem título"}</strong>
                  </td>
                  <td>{item.subtitulo || "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleOpenModal(item)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item.id)}
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
              <h3>{editingItem ? "Editar Item" : "Novo Item"}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="edit-modal-body">
                {/* Upload de imagem */}
                <div className="cover-image-upload">
                  <label>
                    <strong>Imagem:</strong>
                    <div className="cover-preview-row">
                      {formData.imagem ? (
                        <img
                          src={formData.imagem}
                          alt="Preview"
                          className="cover-preview"
                          style={{ maxWidth: "200px" }}
                        />
                      ) : (
                        <div className="cover-placeholder">Nenhuma imagem</div>
                      )}
                      <div className="cover-actions">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files[0];
                            if (f) await uploadImage(f);
                          }}
                        />
                        <small className="hint">
                          Enviar imagem (máx. {IMAGE_MAX_MB} MB)
                        </small>
                        {imageWarning && (
                          <div className="file-warning">{imageWarning}</div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                <label>
                  <strong>Título:</strong>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    placeholder="Título do item"
                  />
                </label>

                <label>
                  <strong>Subtítulo:</strong>
                  <input
                    type="text"
                    value={formData.subtitulo}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitulo: e.target.value })
                    }
                    placeholder="Subtítulo ou resumo breve"
                  />
                </label>

                <label>
                  <strong>Conteúdo:</strong>
                  <RichTextEditor
                    value={formData.conteudo}
                    onChange={(value) =>
                      setFormData({ ...formData, conteudo: value })
                    }
                    api={api}
                  />
                </label>

                <label>
                  <strong>URL de Vídeo (opcional):</strong>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, video_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </label>

                <label>
                  <strong>Link Externo (opcional):</strong>
                  <input
                    type="url"
                    value={formData.link_externo}
                    onChange={(e) =>
                      setFormData({ ...formData, link_externo: e.target.value })
                    }
                    placeholder="https://..."
                  />
                  <small className="hint">
                    Se preenchido, o item será um link clicável
                  </small>
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
                  {editingItem ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionItemsManagement;
