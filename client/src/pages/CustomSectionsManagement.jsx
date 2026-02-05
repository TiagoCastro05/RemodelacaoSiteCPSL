import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  const [draggedItem, setDraggedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLayout, setFilterLayout] = useState("todos");
  const [filterForm, setFilterForm] = useState("todos");
  const FORM_TYPES = [
    { id: "contacto", label: "Formulário de contacto" },
    { id: "erpi", label: "Inscrição ERPI" },
    { id: "centro_de_dia", label: "Inscrição Centro de Dia" },
    { id: "sad", label: "Inscrição SAD" },
    { id: "creche", label: "Inscrição Creche" },
  ];
  const labelForFormType = (tipo) => {
    const found = FORM_TYPES.find((t) => t.id === tipo);
    return found ? found.label : tipo?.toUpperCase() || "Formulário";
  };
  const normalizeFormOptions = (opcoes = [], prefix = "opt") => {
    return opcoes.map((opt, idx) => {
      const tipo = opt?.tipo || opt?.id || opt?.value || opt || "contacto";
      return {
        id: opt?.id || `${prefix}-${idx}-${Date.now()}`,
        tipo,
        label: opt?.label || labelForFormType(tipo),
      };
    });
  };
  const [formData, setFormData] = useState({
    nome: "",
    titulo: "",
    slug: "",
    descricao: "",
    tipo_layout: "cards",
    tem_formulario: false,
    tipo_formulario: "nenhum",
    formulario_opcoes: [],
    formulario_titulo: "",
    formulario_descricao: "",
  });

  const parseFormConfig = (config) => {
    if (!config) return null;
    if (typeof config === "object") return config;
    try {
      return JSON.parse(config);
    } catch (e) {
      console.warn("Configuração de formulário inválida", e);
      return null;
    }
  };

  const confirmAction = (message) =>
    new Promise((resolve) => {
      toast(
        (t) => (
          <div className="toast-confirm">
            <p>{message}</p>
            <div className="toast-confirm-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        ),
        { duration: Infinity },
      );
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
      toast.error("Erro ao carregar seções personalizadas.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (secao = null) => {
    if (secao) {
      setEditingSecao(secao);
      const cfg = parseFormConfig(secao.config_formulario);
      const isMultiple = cfg?.tipo === "multiple";
      const optionsFromCfg = isMultiple
        ? normalizeFormOptions(cfg?.opcoes || [], `cfg-${secao.id || "secao"}`)
        : [];
      setFormData({
        nome: secao.nome,
        titulo: secao.titulo,
        slug: secao.slug,
        descricao: secao.descricao || "",
        tipo_layout: secao.tipo_layout || "cards",
        tem_formulario:
          isMultiple || cfg?.tipo === "contacto" || cfg?.tipo === "erpi"
            ? true
            : secao.tem_formulario || false,
        tipo_formulario: isMultiple
          ? "multiple"
          : cfg?.tipo || (secao.tem_formulario ? "contacto" : "nenhum"),
        formulario_opcoes: optionsFromCfg,
        formulario_titulo: cfg?.titulo || "",
        formulario_descricao: cfg?.descricao || "",
      });
    } else {
      setEditingSecao(null);
      setFormData({
        nome: "",
        titulo: "",
        slug: "",
        descricao: "",
        tipo_layout: "cards",
        tem_formulario: false,
        tipo_formulario: "nenhum",
        formulario_opcoes: [],
        formulario_titulo: "",
        formulario_descricao: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      tipo_formulario,
      formulario_opcoes,
      formulario_titulo,
      formulario_descricao,
      ...rest
    } = formData;

    let config_formulario = null;

    if (tipo_formulario === "multiple") {
      const opcoesLimpa = (formulario_opcoes || [])
        .filter((opt) => opt?.tipo)
        .map((opt, idx) => ({
          tipo: opt.tipo,
          label:
            opt.label?.trim() ||
            labelForFormType(opt.tipo) ||
            `Opção ${idx + 1}`,
        }));

      if (opcoesLimpa.length === 0) {
        toast.error("Adicione pelo menos uma opção de formulário.");
        return;
      }

      config_formulario = {
        tipo: "multiple",
        opcoes: opcoesLimpa,
        titulo: formulario_titulo?.trim() || "",
        descricao: formulario_descricao?.trim() || "",
      };
    } else if (tipo_formulario !== "nenhum") {
      config_formulario = { tipo: tipo_formulario };
    }

    const payload = {
      ...rest,
      tem_formulario: tipo_formulario !== "nenhum",
      config_formulario,
    };
    try {
      if (editingSecao) {
        // Atualizar
        await api.put(`/secoes-personalizadas/${editingSecao.id}`, payload);
        toast.success("Seção atualizada com sucesso!");
      } else {
        // Criar
        await api.post("/secoes-personalizadas", payload);
        toast.success("Seção criada com sucesso!");
      }
      setShowModal(false);
      fetchSecoes();
    } catch (error) {
      console.error("Erro ao salvar seção:", error);
      toast.error(error.response?.data?.message || "Erro ao salvar seção.");
    }
  };

  const handleDragStart = (e, secao) => {
    setDraggedItem(secao);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetSecao) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetSecao.id) {
      setDraggedItem(null);
      return;
    }

    try {
      const draggedIndex = secoes.findIndex((s) => s.id === draggedItem.id);
      const targetIndex = secoes.findIndex((s) => s.id === targetSecao.id);

      const newSecoes = [...secoes];
      const [movedSecao] = newSecoes.splice(draggedIndex, 1);
      newSecoes.splice(targetIndex, 0, movedSecao);

      // Atualizar ordem no backend
      const updatePromises = newSecoes.map((secao, index) =>
        api.put(`/secoes-personalizadas/${secao.id}`, {
          ...secao,
          ordem: index + 1,
        })
      );

      await Promise.all(updatePromises);
      setDraggedItem(null);
      fetchSecoes();
    } catch (error) {
      console.error("Erro ao reordenar:", error);
      toast.error("Erro ao alterar ordem da seção.");
      setDraggedItem(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction(
      "Tem certeza que deseja eliminar esta seção?",
    );
    if (!confirmed) return;
    try {
      await api.delete(`/secoes-personalizadas/${id}`);
      toast.success("Seção eliminada com sucesso!");
      fetchSecoes();
    } catch (error) {
      console.error("Erro ao eliminar seção:", error);
      toast.error("Erro ao eliminar seção.");
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

  const handleAddFormOption = () => {
    setFormData((prev) => ({
      ...prev,
      formulario_opcoes: [
        ...prev.formulario_opcoes,
        {
          id: `opt-${Date.now()}`,
          tipo: "erpi",
          label: "Nova opção",
        },
      ],
    }));
  };

  const handleUpdateFormOption = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      formulario_opcoes: prev.formulario_opcoes.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const handleRemoveFormOption = (id) => {
    setFormData((prev) => ({
      ...prev,
      formulario_opcoes: prev.formulario_opcoes.filter((opt) => opt.id !== id),
    }));
  };

  // Filtrar secções
  const filteredSecoes = secoes.filter((secao) => {
    const matchesSearch =
      secao.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secao.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secao.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLayout =
      filterLayout === "todos" || secao.tipo_layout === filterLayout;
    const cfg = parseFormConfig(secao.config_formulario);
    const hasForm = cfg?.tipo || secao.tem_formulario;
    const matchesForm =
      filterForm === "todos" ||
      (filterForm === "com" && hasForm) ||
      (filterForm === "sem" && !hasForm);
    return matchesSearch && matchesLayout && matchesForm;
  });

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
        <h1>Gerir Secções Personalizadas ({filteredSecoes.length})</h1>
        <div className="dashboard-actions">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Voltar
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            ➕ Nova Secção
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Pesquisar por título, nome ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <select
            value={filterLayout}
            onChange={(e) => setFilterLayout(e.target.value)}
          >
            <option value="todos">Todos os layouts</option>
            <option value="cards">Cards</option>
            <option value="galeria">Galeria</option>
            <option value="lista">Lista</option>
            <option value="texto">Texto</option>
          </select>
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
          >
            <option value="todos">Todos os formulários</option>
            <option value="com">Com formulário</option>
            <option value="sem">Sem formulário</option>
          </select>
        </div>
      </div>

      {filteredSecoes.length === 0 ? (
        <div className="empty-state">
          <p>
            {searchTerm || filterLayout !== "todos" || filterForm !== "todos"
              ? "Nenhuma secção encontrada."
              : "Nenhuma secção personalizada criada ainda."}
          </p>
          {!searchTerm &&
            filterLayout === "todos" &&
            filterForm === "todos" && (
              <button className="btn-primary" onClick={() => handleOpenModal()}>
                Criar primeira secção
              </button>
            )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Título</th>
                <th>Nome/Slug</th>
                <th>Layout</th>
                <th>Formulário</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSecoes.map((secao) => (
                <tr
                  key={secao.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, secao)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, secao)}
                  style={{
                    cursor: "move",
                    opacity: draggedItem?.id === secao.id ? 0.5 : 1,
                    backgroundColor:
                      draggedItem?.id === secao.id ? "#f0f0f0" : "transparent",
                  }}
                >
                  <td>
                    <span
                      style={{ cursor: "grab", userSelect: "none" }}
                      title="Arrastar para reordenar"
                    >
                      ☰ {secao.ordem}
                    </span>
                  </td>
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
                    {(() => {
                      const cfg = parseFormConfig(secao.config_formulario);
                      const formType =
                        cfg?.tipo ||
                        (secao.tem_formulario ? "contacto" : "nenhum");

                      if (!formType || formType === "nenhum") {
                        return (
                          <span className="badge badge-secondary">Não</span>
                        );
                      }

                      if (formType === "multiple") {
                        const total = Array.isArray(cfg?.opcoes)
                          ? cfg.opcoes.length
                          : 0;
                        return (
                          <span className="badge badge-success">
                            Múltiplos {total ? `(${total})` : ""}
                          </span>
                        );
                      }

                      const label = cfg?.label || labelForFormType(formType);
                      return (
                        <span className="badge badge-success">{label}</span>
                      );
                    })()}
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
                    <option value="cards">
                      📦 Cards - Grade de cartões clicáveis
                    </option>
                    <option value="lista">
                      📋 Lista - Items verticais com "Ver mais"
                    </option>
                    <option value="galeria">
                      🖼️ Galeria - Grid de imagens
                    </option>
                    <option value="texto">
                      📄 Texto - Conteúdo expandido (estilo Valores)
                    </option>
                  </select>

                  {/* Preview do layout selecionado */}
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      border: "2px solid #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.9rem",
                        marginBottom: "12px",
                        color: "#555",
                      }}
                    >
                      <strong>Preview do layout:</strong>
                    </div>

                    {/* Preview TEXTO */}
                    {formData.tipo_layout === "texto" && (
                      <div
                        style={{
                          background: "white",
                          padding: "16px",
                          borderRadius: "6px",
                          border: "1px solid #ddd",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--primary-color)",
                            fontWeight: "600",
                            fontSize: "1rem",
                            marginBottom: "8px",
                          }}
                        >
                          📄 Sobre Nós
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            lineHeight: "1.6",
                            color: "#333",
                          }}
                        >
                          Somos uma Instituição Particular de Solidariedade
                          Social (IPSS) reconhecida pelo seu espírito inovador.
                          Dedicando-nos ao apoio social à Pessoas Mais Velhas e
                          à Infância...
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "8px",
                              background: "#f0f4f8",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                            }}
                          >
                            ℹ️ Todo o conteúdo é exibido expandido. Ideal para
                            textos informativos longos.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview GALERIA */}
                    {formData.tipo_layout === "galeria" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                        }}
                      >
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              background: "#ffecd1",
                              borderRadius: "8px",
                              padding: "8px",
                              border: "1px solid #ffb84d",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            <div
                              style={{
                                background: "#ffe0b3",
                                height: "80px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "2rem",
                              }}
                            >
                              🖼️
                            </div>
                            <div
                              style={{
                                textAlign: "center",
                                marginTop: "6px",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                              }}
                            >
                              Creche {i}
                            </div>
                          </div>
                        ))}
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "8px",
                            background: "#fff3e0",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            textAlign: "center",
                          }}
                        >
                          🖱️ Clique nas imagens para ver detalhes no modal
                        </div>
                      </div>
                    )}

                    {/* Preview LISTA */}
                    {formData.tipo_layout === "lista" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            background: "white",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            borderLeft: "4px solid var(--primary-color)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              color: "var(--primary-color)",
                              marginBottom: "4px",
                            }}
                          >
                            teste 1
                          </div>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "#777",
                              marginTop: "4px",
                            }}
                          >
                            Ver mais →
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "8px",
                            background: "#e3f2fd",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            textAlign: "center",
                          }}
                        >
                          🖱️ Clique em "Ver mais" para abrir modal com detalhes
                        </div>
                      </div>
                    )}

                    {/* Preview CARDS */}
                    {formData.tipo_layout === "cards" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            background: "white",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "2px solid var(--primary-color)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "0.95rem",
                              marginBottom: "6px",
                            }}
                          >
                            teste 2
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#666",
                              lineHeight: "1.4",
                            }}
                          >
                            Cards grandeCards grandeCards grandeCards
                            grandeCards grande...
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "8px",
                            background: "#f3e5f5",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            textAlign: "center",
                          }}
                        >
                          🖱️ Clique no card para ver detalhes ou abrir link
                          externo
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label>
                  <strong>Incluir formulário:</strong>
                  <select
                    value={formData.tipo_formulario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipo_formulario: e.target.value,
                        tem_formulario: e.target.value !== "nenhum",
                        formulario_opcoes:
                          e.target.value === "multiple"
                            ? formData.formulario_opcoes.length > 0
                              ? formData.formulario_opcoes
                              : [
                                  {
                                    id: `opt-${Date.now()}`,
                                    tipo: "erpi",
                                    label: "Inscrição ERPI",
                                  },
                                  {
                                    id: `opt-${Date.now()}-2`,
                                    tipo: "contacto",
                                    label: "Formulário de contacto",
                                  },
                                ]
                            : formData.formulario_opcoes,
                      })
                    }
                  >
                    <option value="nenhum">Nenhum</option>
                    <option value="contacto">Formulário de contacto</option>
                    <option value="erpi">Formulário ERPI</option>
                    <option value="centro_de_dia">
                      Formulário Centro de Dia
                    </option>
                    <option value="sad">Formulário SAD</option>
                    <option value="creche">Formulário Creche</option>
                    <option value="multiple">Vários formulários</option>
                  </select>
                  <small className="hint">
                    Escolha um ou vários formulários. Em "Vários formulários"
                    pode definir rótulos diferentes (ex: ERPI, CD, SAD, Creche)
                    e reutilizar o mesmo tipo de formulário.
                  </small>
                </label>

                {formData.tipo_formulario === "multiple" && (
                  <div className="form-options-config">
                    <label>
                      <strong>Título do seletor (opcional):</strong>
                      <input
                        type="text"
                        value={formData.formulario_titulo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            formulario_titulo: e.target.value,
                          })
                        }
                        placeholder="Ex: Escolha o serviço"
                      />
                    </label>

                    <label>
                      <strong>Descrição curta (opcional):</strong>
                      <textarea
                        rows="2"
                        value={formData.formulario_descricao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            formulario_descricao: e.target.value,
                          })
                        }
                        placeholder="Texto que aparece por baixo do seletor"
                      />
                    </label>

                    <div className="options-list">
                      <div className="options-list-header">
                        <strong>Opções de formulário</strong>
                        <button
                          type="button"
                          className="btn-secondary btn-add-option"
                          onClick={handleAddFormOption}
                        >
                          ➕ Adicionar opção
                        </button>
                      </div>

                      {formData.formulario_opcoes.length === 0 && (
                        <p className="hint">Adicione pelo menos uma opção.</p>
                      )}

                      {formData.formulario_opcoes.map((opt) => (
                        <div key={opt.id} className="option-row">
                          <select
                            value={opt.tipo}
                            onChange={(e) =>
                              handleUpdateFormOption(
                                opt.id,
                                "tipo",
                                e.target.value
                              )
                            }
                          >
                            {FORM_TYPES.map((ft) => (
                              <option key={ft.id} value={ft.id}>
                                {ft.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) =>
                              handleUpdateFormOption(
                                opt.id,
                                "label",
                                e.target.value
                              )
                            }
                            placeholder="Rótulo visível para o utilizador"
                          />
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleRemoveFormOption(opt.id)}
                            title="Remover opção"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                    <small className="hint">
                      Pode criar opções com o mesmo tipo de formulário mas
                      rótulos diferentes (ex: ERPI, CD, SAD, Creche).
                    </small>
                  </div>
                )}
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
