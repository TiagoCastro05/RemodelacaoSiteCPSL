import React, { useState, useEffect, useContext, useRef } from "react";
import Header from "../components/Header";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Home.css";

// Local SVG placeholder (data URI) to avoid external requests to via.placeholder.com
const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><rect fill='#f6f7fb' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#888' font-size='28' font-family='Arial, sans-serif'>Imagem</text></svg>`
);

// Editor simples baseado em contentEditable (compatível com React 19+)
function RichTextEditor({ value, onChange, api }) {
  const editorRef = useRef(null);
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false, list: false });

  // Upload de imagem para /api/media e retorna URL absoluto
  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
  formData.append("tabela_referencia", "noticias_eventos");

      const response = await api.post("/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = response.data?.data?.url;
      if (!url) throw new Error("Upload não retornou URL");
      const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
      return url.startsWith("http") ? url : `${base}${url}`;
    } catch (err) {
      console.error("Erro ao enviar imagem:", err);
      alert("Erro ao enviar imagem.");
      return null;
    }
  };

  const exec = (command, value = null) => {
    // execCommand ainda funciona na maioria dos browsers para operações simples
    document.execCommand(command, false, value);
    // atualizar estado
    onChange(editorRef.current.innerHTML);
    // recolocar foco no editor para que a escrita continue e o caret seja preservado
    try {
      editorRef.current && editorRef.current.focus();
    } catch (e) {
      // ignore
    }
    // update our internal formats state only when user clicked toolbar
    if (command === "bold") setFormats((p) => ({ ...p, bold: !p.bold }));
    if (command === "italic") setFormats((p) => ({ ...p, italic: !p.italic }));
    if (command === "underline") setFormats((p) => ({ ...p, underline: !p.underline }));
    if (command === "insertUnorderedList") setFormats((p) => ({ ...p, list: !p.list }));
  };

  // Formats are updated only when the toolbar buttons are clicked (see exec()).

  const handleInsertLink = () => {
    const url = window.prompt("URL (inclui https://)");
    if (url) exec("createLink", url);
  };

  const handleImagePick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const url = await uploadImage(file);
      if (url) {
        // inserir imagem como HTML
        const imgHtml = `<img src="${url}" alt="image" style="max-width:100%;"/>`;
        document.execCommand("insertHTML", false, imgHtml);
        onChange(editorRef.current.innerHTML);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (editorRef.current) {
      const normalized = normalizeInitialHtml(value || "");
      if (editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ensure toolbar defaults to no active formats when mounting
  useEffect(() => {
    setFormats({ bold: false, italic: false, underline: false, list: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // no-op: we keep toolbar button state controlled only by toolbar clicks

  return (
    <div className="richtext-editor">
      <div className="rt-toolbar">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Bold" className={`rt-btn ${formats.bold ? 'active' : ''}`}>
          <strong>B</strong>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Italic" className={`rt-btn ${formats.italic ? 'active' : ''}`}>
          <em>I</em>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} title="Underline" className={`rt-btn ${formats.underline ? 'active' : ''}`}>
          <u>U</u>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} title="Bullet" className={`rt-btn ${formats.list ? 'active' : ''}`}>
          • Lista
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleInsertLink} title="Adicionar hiperligação" className="rt-btn rt-btn-link">
          + adicionar hiperligacao
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleImagePick} title="Adicionar fotografia" className="rt-btn rt-btn-image">
          🖼️
        </button>
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue=""
          aria-label="Tamanho da fonte"
        >
          <option value="">Tamanho</option>
          <option value="1">Pequeno</option>
          <option value="3">Normal</option>
          <option value="5">Grande</option>
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="rt-editor-area"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onDoubleClick={(e) => e.preventDefault()} /* prevent double-click from triggering format toggles */
        onFocus={() => {
          // compute real format state at caret/selection and sync toolbar icons
          try {
            const sel = document.getSelection();
            let bold = false;
            let italic = false;
            let underline = false;
            let list = false;
            if (sel && sel.rangeCount > 0) {
              // prefer queryCommandState if available
              try {
                bold = document.queryCommandState('bold');
                italic = document.queryCommandState('italic');
                underline = document.queryCommandState('underline');
                list = document.queryCommandState('insertUnorderedList');
              } catch (e) {
                // fallback: inspect ancestor nodes
                const node = sel.anchorNode;
                const el = node && node.nodeType === 3 ? node.parentElement : node;
                if (el) {
                  bold = !!el.closest && !!el.closest('strong, b');
                  italic = !!el.closest && !!el.closest('em, i');
                  underline = !!el.closest && !!el.closest('u');
                  list = !!el.closest && !!el.closest('ul, ol');
                }
              }
            }
            setFormats({ bold, italic, underline, list });
          } catch (err) {
            // ignore
          }
        }}
        style={{ minHeight: 150, border: "1px solid #ddd", padding: 8 }}
      />
    </div>
  );
}

// utilitário simples para remover tags HTML (usado para resumo)
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

  // normalize initial HTML so we don't start with an outer strong/b tag which makes typing bold by default
  function normalizeInitialHtml(html) {
    if (!html) return "";
    let out = html.trim();
    // remove wrapping <strong> or <b> if entire content is inside it
    out = out.replace(/^<(strong|b)>([\s\S]*)<\/(strong|b)>$/i, "$2");
    // remove empty strong around whitespace
    out = out.replace(/<strong>\s*<\/strong>/gi, "");
    out = out.replace(/<b>\s*<\/b>/gi, "");
    return out;
  }

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
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // Upload cover image (imagem_destaque) and set editingData.imagem_destaque
  const uploadCoverImage = async (file) => {
    try {
  // show placeholder immediately while upload runs
  const placeholderBase = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
  setEditingData((d) => ({ ...d, imagem_destaque: `${placeholderBase}${PLACEHOLDER_SVG}` }));

      const formData = new FormData();
      formData.append("file", file);
  formData.append("tabela_referencia", "noticias_eventos");
      // id_referencia could be null for now
      const response = await api.post("/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  let url = response.data?.data?.url;
  if (!url) throw new Error("Upload não retornou URL");
  const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
  url = url.startsWith("http") ? url : `${base}${url}`;
  setEditingData((d) => ({ ...d, imagem_destaque: url }));
    } catch (err) {
      console.error("Erro ao enviar imagem de capa:", err);
      alert("Erro ao enviar imagem de capa.");
    }
  };

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
          const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
          const normalized = (response.data.data || []).map((n) => {
            const obj = { ...n };
            if (obj.imagem_destaque && !obj.imagem_destaque.startsWith("http")) {
              obj.imagem_destaque = `${base}${obj.imagem_destaque}`;
            }
            if (Array.isArray(obj.media)) {
              obj.media = obj.media.map((m) => ({
                ...m,
                url: m.url && !m.url.startsWith("http") ? `${base}${m.url}` : m.url,
              }));
            }
            return obj;
          });
          setNoticias(normalized);
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

  const openNews = async (noticia) => {
    try {
      const resp = await api.get(`/noticias/${noticia.id}`);
      if (resp.data && resp.data.success) {
        const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
        const data = resp.data.data || {};
        // normalize imagem_destaque
        if (data.imagem_destaque && !data.imagem_destaque.startsWith("http")) {
          data.imagem_destaque = `${base}${data.imagem_destaque}`;
        }
        // normalize media urls
        if (Array.isArray(data.media)) {
          data.media = data.media.map((m) => {
            if (m.url && !m.url.startsWith("http")) {
              return { ...m, url: `${base}${m.url}` };
            }
            return m;
          });
        }
        setSelectedNews(data);
      } else {
        setSelectedNews(noticia);
      }
    } catch (err) {
      console.error("Erro ao obter notícia completa:", err);
      setSelectedNews(noticia);
    }
    setShowNewsModal(true);
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
                            e.target.src = PLACEHOLDER_SVG;
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
                        <p className="project-date">🗓️ Início: {new Date(project.data_inicio).toLocaleDateString("pt-PT")}</p>
                      )}
                    </div>
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
                <div
                  key={noticia.id}
                  className="content-subsection noticia-item"
                  onClick={() => openNews(noticia)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openNews(noticia)}
                >
                  {noticia.imagem_destaque && (
                    <img
                      src={noticia.imagem_destaque}
                      alt={noticia.titulo}
                      className="noticia-image"
                      onError={(e) => {
                        console.warn('Imagem não encontrada:', e.target.src);
                        e.target.src = PLACEHOLDER_SVG;
                      }}
                    />
                  )}

                  <div className="noticia-body">
                    <h3 className="noticia-title">{noticia.titulo}</h3>
                    <p className="noticia-summary">
                      {noticia.resumo || (stripHtml(noticia.conteudo || "").slice(0, 200) + "...")}
                    </p>
                  </div>

                  <p className="noticia-date">
                    📅 {new Date(noticia.data_publicacao || noticia.created_at).toLocaleDateString("pt-PT")}
                  </p>

                  {isEditMode && user && (
                    <div className="subsection-actions noticia-actions">
                      <button
                        className="btn-edit-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit("noticias", noticia, noticia.id);
                        }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(noticia.id, "noticias");
                        }}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
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

          {/* Formulário de contacto público */}
          {!isEditMode && (
            <div className="contact-form">
              <h3>Envie-nos uma mensagem</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = {
                    nome: form.nome.value,
                    email: form.email.value,
                    assunto: form.assunto.value,
                    mensagem: form.mensagem.value,
                  };
                  try {
                    const resp = await api.post('/contactos/form', data);
                    if (resp.data && resp.data.success) {
                      alert('Mensagem enviada. Obrigado!');
                      form.reset();
                    } else {
                      alert('Erro ao enviar mensagem.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Erro ao enviar mensagem.');
                  }
                }}
              >
                <div className="form-row">
                  <div className="form-field name-field">
                    <label htmlFor="nome">Nome</label>
                    <div className="input-with-icon">
                      <span className="input-icon">👤</span>
                      <input id="nome" name="nome" placeholder="Nome" required />
                    </div>
                  </div>

                  <div className="form-field email-field">
                    <label htmlFor="email">Email</label>
                    <div className="input-with-icon">
                      <span className="input-icon">✉️</span>
                      <input id="email" name="email" type="email" placeholder="Email" required />
                    </div>
                  </div>
                </div>

                <div className="form-field subject-field">
                  <label htmlFor="assunto">Assunto</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📝</span>
                    <input id="assunto" name="assunto" placeholder="Assunto" required />
                  </div>
                </div>

                <div className="form-field message-field">
                  <label htmlFor="mensagem">Mensagem</label>
                  <textarea id="mensagem" name="mensagem" rows="6" placeholder="Mensagem" required />
                </div>

                <div className="form-actions" style={{ marginTop: 10 }}>
                  <button type="submit" className="btn-save">Enviar Mensagem</button>
                </div>
              </form>
            </div>
          )}
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
                  {editingSection === "noticias" && (
                    <div className="cover-image-upload">
                      <label>
                        <strong>Imagem de Capa:</strong>
                        <div className="cover-preview-row">
                          {editingData.imagem_destaque ? (
                            <img
                              src={editingData.imagem_destaque}
                              alt="Capa"
                              className="cover-preview"
                              onError={(e) => {
                                    e.target.src = PLACEHOLDER_SVG;
                                  }}
                            />
                          ) : (
                            <div className="cover-placeholder">Nenhuma imagem de capa</div>
                          )}
                          <div className="cover-actions">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const f = e.target.files[0];
                                if (f) await uploadCoverImage(f);
                              }}
                            />
                            <small className="hint">Enviar imagem de capa (aparece antes do título)</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

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
                            setEditingData({ ...editingData, resumo: e.target.value })
                          }
                          rows="3"
                          placeholder="Resumo da notícia"
                        />
                      </label>
                      <label>
                        <strong>Conteúdo:</strong>
                        <RichTextEditor
                          value={editingData.conteudo || ""}
                          onChange={(value) =>
                            setEditingData({ ...editingData, conteudo: value })
                          }
                          api={api}
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

      {/* Modal de Visualização da Notícia */}
      {showNewsModal && selectedNews && (
        <div className="edit-modal-overlay" onClick={() => setShowNewsModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>{selectedNews.titulo}</h3>
              <button className="btn-close" onClick={() => setShowNewsModal(false)}>✕</button>
            </div>
            <div className="edit-modal-body">
              {/* Capa */}
              {selectedNews.imagem_destaque && (
                <img
                  src={selectedNews.imagem_destaque}
                  alt={selectedNews.titulo}
                  className="content-image"
                />
              )}

              {/* Título -> repetir aqui para colocar depois da capa */}
              <h3 style={{ marginTop: 12 }}>{selectedNews.titulo}</h3>

              {/* Resumo */}
              {selectedNews.resumo && (
                <p className="noticia-summary" style={{ marginTop: 8 }}>{selectedNews.resumo}</p>
              )}

              {/* Conteúdo HTML */}
              <div
                className="noticia-conteudo"
                dangerouslySetInnerHTML={{ __html: selectedNews.conteudo || "" }}
              />

              {/* Imagens adicionais associadas (media) */}
              {selectedNews.media && selectedNews.media.length > 0 && (
                <div className="noticia-media-gallery">
                  {selectedNews.media
                    .filter((m) => m.url !== selectedNews.imagem_destaque && (!m.tipo || m.tipo.includes("imagem")))
                    .map((m) => (
                      <img
                        key={m.id || m.url}
                        src={m.url}
                        alt={m.titulo || "imagem"}
                        className="noticia-additional-image"
                        onError={(e) => {
                          console.warn('Imagem adicional não encontrada:', e.target.src);
                          e.target.src = PLACEHOLDER_SVG;
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
            <div className="edit-modal-footer" style={{ justifyContent: 'space-between' }}>
              <div />
              <div style={{ textAlign: 'right' }}>
                <small className="project-date">📅 {new Date(selectedNews.data_publicacao || selectedNews.created_at).toLocaleDateString('pt-PT')}</small>
              </div>
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
                {/* Cover image for notícias: appear before title */}
                {editingSection === "noticias" && (
                  <div className="cover-image-upload">
                    <label>
                      <strong>Imagem de Capa:</strong>
                      <div className="cover-preview-row">
                        {editingData.imagem_destaque ? (
                          <img
                            src={editingData.imagem_destaque}
                            alt="Capa"
                            className="cover-preview"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_SVG;
                            }}
                          />
                        ) : (
                          <div className="cover-placeholder">Nenhuma imagem de capa</div>
                        )}
                        <div className="cover-actions">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files[0];
                              if (f) await uploadCoverImage(f);
                            }}
                          />
                          <small className="hint">Enviar imagem de capa (aparece antes do título)</small>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

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
                          setEditingData({ ...editingData, resumo: e.target.value })
                        }
                        rows="3"
                        placeholder="Breve resumo da notícia"
                      />
                    </label>
                    <label>
                      <strong>Conteúdo:</strong>
                      {/* Editor rich-text para conteúdo da notícia */}
                      <RichTextEditor
                        value={editingData.conteudo || ""}
                        onChange={(value) =>
                          setEditingData({ ...editingData, conteudo: value })
                        }
                        api={api}
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
