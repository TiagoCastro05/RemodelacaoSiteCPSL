import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Home.css";

const Home = ({ isEditMode = false }) => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [conteudoInstitucional, setConteudoInstitucional] = useState([]);
  const [respostasSociais, setRespostasSociais] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingRespostas, setLoadingRespostas] = useState(true);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const { user } = useContext(AuthContext);

  // Definir as secções do site
  const sections = [
    { id: "instituicao", label: "Instituição" },
    { id: "projetos", label: "Projetos" },
    { id: "respostas-sociais", label: "Respostas Sociais" },
    { id: "noticias", label: "Notícias" },
    { id: "contactos", label: "Contactos" },
  ];

  // Buscar projetos da API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await api.get("/projetos");
        // Filtrar apenas projetos ativos
        const activeProjects = (response.data.data || []).filter(
          (project) => project.ativo
        );
        setProjects(activeProjects);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Buscar conteúdo institucional
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoadingContent(true);
        const response = await api.get("/conteudo");
        if (response.data.success) {
          setConteudoInstitucional(response.data.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar conteúdo:", error);
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, []);

  // Buscar respostas sociais
  useEffect(() => {
    const fetchRespostas = async () => {
      try {
        setLoadingRespostas(true);
        const response = await api.get("/respostas-sociais");
        if (response.data.success) {
          setRespostasSociais(response.data.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar respostas sociais:", error);
      } finally {
        setLoadingRespostas(false);
      }
    };

    fetchRespostas();
  }, []);

  // Buscar notícias
  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        setLoadingNoticias(true);
        const response = await api.get("/noticias");
        if (response.data.success) {
          setNoticias(response.data.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar notícias:", error);
      } finally {
        setLoadingNoticias(false);
      }
    };

    fetchNoticias();
  }, []);

  // Abrir modal de edição
  const handleEdit = (section, data = {}, id = null) => {
    setEditingSection(section);
    setEditingData(data);
    setEditingId(id);
    setShowEditModal(true);
  };

  // Adicionar nova subseção
  const handleAddSubsection = (section = "instituicao") => {
    console.log("handleAddSubsection - section:", section);
    setEditingSection(section);
    if (section === "respostas-sociais") {
      setEditingData({ titulo: "", descricao: "" });
    } else if (section === "noticias") {
      setEditingData({ titulo: "", resumo: "", conteudo: "", tipo: "noticia" });
    } else {
      setEditingData({ titulo: "", conteudo: "" });
    }
    setEditingId(null);
    setShowAddModal(true);
  };

  // Salvar nova subseção
  const handleSaveNew = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingSection === "respostas-sociais") {
        response = await api.post("/respostas-sociais", editingData);
        if (response.data.success) {
          setRespostasSociais([...respostasSociais, response.data.data]);
        }
      } else if (editingSection === "noticias") {
        response = await api.post("/noticias", {
          ...editingData,
          publicado: true,
        });
        if (response.data.success) {
          setNoticias([...noticias, response.data.data]);
        }
      } else {
        console.log("Enviando para /conteudo:", editingData);
        response = await api.post("/conteudo", editingData);
        console.log("Resposta de /conteudo:", response.data);
        if (response.data.success) {
          setConteudoInstitucional([
            ...conteudoInstitucional,
            response.data.data,
          ]);
        }
      }

      setShowAddModal(false);
      alert("Conteúdo adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      alert("Erro ao adicionar conteúdo.");
    }
  };

  // Eliminar subseção
  const handleDelete = async (id, section) => {
    if (!window.confirm("Tem certeza que deseja eliminar este item?")) {
      return;
    }
    try {
      if (section === "respostas-sociais") {
        await api.delete(`/respostas-sociais/${id}`);
        setRespostasSociais(respostasSociais.filter((r) => r.id !== id));
      } else if (section === "noticias") {
        await api.delete(`/noticias/${id}`);
        setNoticias(noticias.filter((n) => n.id !== id));
      } else {
        await api.delete(`/conteudo/${id}`);
        setConteudoInstitucional(
          conteudoInstitucional.filter((c) => c.id !== id)
        );
      }
      alert("Item eliminado com sucesso!");
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      alert("Erro ao eliminar item.");
    }
  };

  // Salvar edição
  const handleSave = async () => {
    try {
      if (editingSection === "institucional" && editingId) {
        await api.put(`/conteudo/${editingId}`, editingData);
        setConteudoInstitucional(
          conteudoInstitucional.map((c) =>
            c.id === editingId ? { ...c, ...editingData } : c
          )
        );
        setShowEditModal(false);
        alert("Conteúdo atualizado com sucesso!");
      } else if (editingSection === "respostas-sociais" && editingId) {
        await api.put(`/respostas-sociais/${editingId}`, editingData);
        setRespostasSociais(
          respostasSociais.map((r) =>
            r.id === editingId ? { ...r, ...editingData } : r
          )
        );
        setShowEditModal(false);
        alert("Resposta Social atualizada com sucesso!");
      } else if (editingSection === "noticias" && editingId) {
        await api.put(`/noticias/${editingId}`, editingData);
        setNoticias(
          noticias.map((n) =>
            n.id === editingId ? { ...n, ...editingData } : n
          )
        );
        setShowEditModal(false);
        alert("Notícia atualizada com sucesso!");
      } else if (editingSection === "hero") {
        alert("Funcionalidade de edição do Hero será implementada");
        setShowEditModal(false);
      } else if (editingSection === "contactos") {
        alert("Funcionalidade de edição de Contactos será implementada");
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  return (
    <div className="home-page">
      <Header sections={sections} isEditMode={isEditMode} />

      <section className="hero-section">
        <div className="container">
          {isEditMode && user && (
            <button
              className="btn-edit-inline btn-edit-hero"
              onClick={() =>
                handleEdit("hero", {
                  titulo: "Centro Paroquial e Social de Lanheses",
                  subtitulo:
                    "Dedicando-nos ao apoio social à Pessoas Mais Velhas e à Infância",
                })
              }
              title="Editar Hero"
            >
              ✏️
            </button>
          )}
          <h1>Centro Paroquial e Social de Lanheses</h1>
          <p>
            Dedicando-nos ao apoio social à Pessoas Mais Velhas e à Infância
          </p>
          <a href="#contactos" className="btn-primary">
            Entre em Contacto
          </a>
        </div>
      </section>

      <section id="instituicao" className="section">
        <div className="container">
          <div className="section-header-editable">
            <h2>Instituição</h2>
            {isEditMode && user && (
              <button
                className="btn-add-subsection"
                onClick={handleAddSubsection}
                title="Adicionar subseção"
              >
                ➕ Adicionar
              </button>
            )}
          </div>

          {loadingContent ? (
            <p>A carregar conteúdo...</p>
          ) : conteudoInstitucional.length === 0 ? (
            <p>
              Somos uma Instituição Particular de Solidariedade Social (IPSS)
              reconhecida pelo seu espírito inovador.
            </p>
          ) : (
            <div className="institutional-content">
              {conteudoInstitucional.map((content) => (
                <div key={content.id} className="content-subsection">
                  <div className="subsection-header">
                    <h3>{content.titulo}</h3>
                    {isEditMode && user && (
                      <div className="subsection-actions">
                        <button
                          className="btn-edit-inline"
                          onClick={() =>
                            handleEdit("institucional", content, content.id)
                          }
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-inline"
                          onClick={() =>
                            handleDelete(content.id, "instituicao")
                          }
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <p>{content.conteudo}</p>
                  {content.imagem_url && (
                    <img
                      src={content.imagem_url}
                      alt={content.titulo}
                      className="content-image"
                    />
                  )}
                  {content.video_url && (
                    <video controls className="content-video">
                      <source src={content.video_url} type="video/mp4" />
                    </video>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="projetos" className="section">
        <div className="container">
          <h2>Projetos</h2>
          <p className="section-intro">Conheça os nossos projetos em curso.</p>

          {loadingProjects ? (
            <div className="loading-projects">A carregar projetos...</div>
          ) : projects.length === 0 ? (
            <p className="no-projects">Nenhum projeto disponível no momento.</p>
          ) : (
            <div className="projects-list">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-item ${
                    project.url_externa ? "clickable" : ""
                  }`}
                  onClick={() => {
                    if (project.url_externa) {
                      window.open(project.url_externa, "_blank");
                    }
                  }}
                  style={{
                    cursor: project.url_externa ? "pointer" : "default",
                  }}
                >
                  <div className="project-image-container">
                    {project.imagem_destaque ? (
                      <img
                        src={project.imagem_destaque}
                        alt={project.titulo}
                        className="project-image"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/800x400?text=Projeto";
                        }}
                      />
                    ) : (
                      <div className="project-placeholder">
                        <span>📁 {project.titulo}</span>
                      </div>
                    )}
                    {project.url_externa && (
                      <div className="project-link-overlay">
                        <span>🔗 Clique para saber mais</span>
                      </div>
                    )}
                  </div>

                  <div className="project-info">
                    <h3>
                      {project.titulo}
                      {project.url_externa && (
                        <span className="link-icon">🔗</span>
                      )}
                    </h3>
                    <p className="project-description">{project.descricao}</p>
                    {project.data_inicio && (
                      <p className="project-date">
                        🗓️ Início:{" "}
                        {new Date(project.data_inicio).toLocaleDateString(
                          "pt-PT"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="respostas-sociais" className="section">
        <div className="container">
          <div className="section-header-editable">
            <h2>Respostas Sociais</h2>
            {isEditMode && user && (
              <button
                className="btn-add-subsection"
                onClick={() => handleAddSubsection("respostas-sociais")}
                title="Adicionar resposta social"
              >
                ➥ Adicionar
              </button>
            )}
          </div>

          {loadingRespostas ? (
            <p>A carregar respostas sociais...</p>
          ) : respostasSociais.length === 0 ? (
            <p>Oferecemos diversos serviços de apoio à comunidade.</p>
          ) : (
            <div className="institutional-content">
              {respostasSociais.map((resposta) => (
                <div key={resposta.id} className="content-subsection">
                  <div className="subsection-header">
                    <h3>{resposta.titulo}</h3>
                    {isEditMode && user && (
                      <div className="subsection-actions">
                        <button
                          className="btn-edit-inline"
                          onClick={() =>
                            handleEdit(
                              "respostas-sociais",
                              resposta,
                              resposta.id
                            )
                          }
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-inline"
                          onClick={() =>
                            handleDelete(resposta.id, "respostas-sociais")
                          }
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <p>{resposta.descricao}</p>
                  {resposta.imagem_destaque && (
                    <img
                      src={resposta.imagem_destaque}
                      alt={resposta.titulo}
                      className="content-image"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="noticias" className="section">
        <div className="container">
          <div className="section-header-editable">
            <h2>Notícias e Eventos</h2>
            {isEditMode && user && (
              <button
                className="btn-add-subsection"
                onClick={() => handleAddSubsection("noticias")}
                title="Adicionar notícia"
              >
                ➥ Adicionar
              </button>
            )}
          </div>

          {loadingNoticias ? (
            <p>A carregar notícias...</p>
          ) : noticias.length === 0 ? (
            <p>Mantenha-se atualizado com as nossas novidades.</p>
          ) : (
            <div className="institutional-content">
              {noticias.slice(0, 5).map((noticia) => (
                <div key={noticia.id} className="content-subsection">
                  <div className="subsection-header">
                    <h3>{noticia.titulo}</h3>
                    {isEditMode && user && (
                      <div className="subsection-actions">
                        <button
                          className="btn-edit-inline"
                          onClick={() =>
                            handleEdit("noticias", noticia, noticia.id)
                          }
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-inline"
                          onClick={() => handleDelete(noticia.id, "noticias")}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <p>
                    {noticia.resumo ||
                      noticia.conteudo?.substring(0, 200) + "..."}
                  </p>
                  {noticia.imagem_destaque && (
                    <img
                      src={noticia.imagem_destaque}
                      alt={noticia.titulo}
                      className="content-image"
                    />
                  )}
                  <p className="project-date">
                    📅{" "}
                    {new Date(
                      noticia.data_publicacao || noticia.created_at
                    ).toLocaleDateString("pt-PT")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="contactos" className="section">
        <div className="container">
          <div className="section-header-editable">
            <h2>Contactos</h2>
            {isEditMode && user && (
              <button
                className="btn-edit-inline"
                onClick={() =>
                  handleEdit("contactos", {
                    morada: "Estrada da Igreja, nº468, Lanheses",
                    telefone: "258 739 900",
                    email: "geral@cpslanheses.pt",
                  })
                }
                title="Editar Contactos"
              >
                ✏️
              </button>
            )}
          </div>
          <div className="contact-info">
            <p>
              <strong>Morada:</strong> Estrada da Igreja, nº468, Lanheses
            </p>
            <p>
              <strong>Telefone:</strong> 258 739 900
            </p>
            <p>
              <strong>Email:</strong> geral@cpslanheses.pt
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>
            &copy; 2025 Centro Paroquial e Social de Lanheses. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>

      {/* Modal de Edição Inline */}
      {showEditModal && (
        <div
          className="edit-modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>
                Editar{" "}
                {editingSection === "institucional"
                  ? "Instituição"
                  : editingSection}
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="edit-modal-body">
              {editingSection === "institucional" && (
                <>
                  <label>
                    <strong>Título:</strong>
                    <input
                      type="text"
                      value={editingData.titulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          titulo: e.target.value,
                        })
                      }
                      placeholder="Título da seção"
                    />
                  </label>
                  <label>
                    <strong>Texto:</strong>
                    <textarea
                      value={editingData.conteudo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          conteudo: e.target.value,
                        })
                      }
                      rows="6"
                      placeholder="Texto institucional"
                    />
                  </label>
                </>
              )}

              {editingSection === "hero" && (
                <>
                  <label>
                    <strong>Título Principal:</strong>
                    <input
                      type="text"
                      value={editingData.titulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          titulo: e.target.value,
                        })
                      }
                      placeholder="Título do Hero"
                    />
                  </label>
                  <label>
                    <strong>Subtítulo:</strong>
                    <textarea
                      value={editingData.subtitulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          subtitulo: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder="Subtítulo do Hero"
                    />
                  </label>
                </>
              )}

              {(editingSection === "respostas-sociais" ||
                editingSection === "noticias") && (
                <>
                  <label>
                    <strong>Título:</strong>
                    <input
                      type="text"
                      value={editingData.titulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          titulo: e.target.value,
                        })
                      }
                      placeholder="Título"
                    />
                  </label>
                  {editingSection === "respostas-sociais" && (
                    <label>
                      <strong>Descrição:</strong>
                      <textarea
                        value={editingData.descricao || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            descricao: e.target.value,
                          })
                        }
                        rows="6"
                        placeholder="Descrição da resposta social"
                      />
                    </label>
                  )}
                  {editingSection === "noticias" && (
                    <>
                      <label>
                        <strong>Resumo:</strong>
                        <textarea
                          value={editingData.resumo || ""}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              resumo: e.target.value,
                            })
                          }
                          rows="3"
                          placeholder="Resumo da notícia"
                        />
                      </label>
                      <label>
                        <strong>Conteúdo:</strong>
                        <textarea
                          value={editingData.conteudo || ""}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              conteudo: e.target.value,
                            })
                          }
                          rows="6"
                          placeholder="Conteúdo completo"
                        />
                      </label>
                    </>
                  )}
                </>
              )}

              {editingSection === "contactos" && (
                <>
                  <label>
                    <strong>Morada:</strong>
                    <input
                      type="text"
                      value={editingData.morada || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          morada: e.target.value,
                        })
                      }
                      placeholder="Morada da instituição"
                    />
                  </label>
                  <label>
                    <strong>Telefone:</strong>
                    <input
                      type="text"
                      value={editingData.telefone || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          telefone: e.target.value,
                        })
                      }
                      placeholder="Telefone de contacto"
                    />
                  </label>
                  <label>
                    <strong>Email:</strong>
                    <input
                      type="email"
                      value={editingData.email || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          email: e.target.value,
                        })
                      }
                      placeholder="Email de contacto"
                    />
                  </label>
                </>
              )}
            </div>
            <div className="edit-modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Subseção */}
      {showAddModal && (
        <div
          className="edit-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>
                Adicionar{" "}
                {editingSection === "respostas-sociais"
                  ? "Resposta Social"
                  : editingSection === "noticias"
                  ? "Notícia"
                  : "Subseção Institucional"}
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveNew}>
              <div className="edit-modal-body">
                <label>
                  <strong>Título:</strong>
                  <input
                    type="text"
                    value={editingData.titulo || ""}
                    onChange={(e) =>
                      setEditingData({ ...editingData, titulo: e.target.value })
                    }
                    required
                    placeholder={
                      editingSection === "respostas-sociais"
                        ? "Ex: ERPI, Creche, Centro de Dia..."
                        : editingSection === "noticias"
                        ? "Título da notícia"
                        : "Ex: Sobre Nós, Valores, Visão e Missão..."
                    }
                  />
                </label>

                {/* Notícias */}
                {editingSection === "noticias" && (
                  <>
                    <label>
                      <strong>Resumo:</strong>
                      <textarea
                        value={editingData.resumo || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            resumo: e.target.value,
                          })
                        }
                        rows="3"
                        placeholder="Breve resumo da notícia"
                      />
                    </label>
                    <label>
                      <strong>Conteúdo:</strong>
                      <textarea
                        value={editingData.conteudo || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            conteudo: e.target.value,
                          })
                        }
                        rows="6"
                        required
                        placeholder="Conteúdo completo da notícia"
                      />
                    </label>
                  </>
                )}

                {/* Respostas Sociais */}
                {editingSection === "respostas-sociais" && (
                  <label>
                    <strong>Descrição:</strong>
                    <textarea
                      value={editingData.descricao || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          descricao: e.target.value,
                        })
                      }
                      rows="6"
                      required
                      placeholder="Descrição da resposta social"
                    />
                  </label>
                )}

                {/* Instituição - Sempre mostrar se não for notícias nem respostas sociais */}
                {editingSection !== "noticias" &&
                  editingSection !== "respostas-sociais" && (
                    <label>
                      <strong>Descrição:</strong>
                      <textarea
                        value={editingData.conteudo || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            conteudo: e.target.value,
                          })
                        }
                        rows="6"
                        required
                        placeholder="Conteúdo da subseção institucional"
                      />
                    </label>
                  )}
              </div>
              <div className="edit-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
