import React, { useState, useEffect, useContext, useRef } from "react";
import Header from "../components/Header";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Home.css";

// Local SVG placeholder (data URI) to avoid external requests to via.placeholder.com
const PLACEHOLDER_SVG =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><rect fill='#f6f7fb' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#888' font-size='28' font-family='Arial, sans-serif'>Imagem</text></svg>`
  );

const PDF_PLACEHOLDER =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='350'><rect fill='#0b1930' width='100%' height='100%'/><rect x='40' y='30' rx='18' ry='18' width='520' height='290' fill='#132844' stroke='#4da3ff' stroke-width='6'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#4da3ff' font-size='64' font-family='Arial, sans-serif' font-weight='700'>PDF</text></svg>`
  );

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT");
  } catch (e) {
    return dateStr;
  }
};

// Editor simples baseado em contentEditable (compatível com React 19+)
function RichTextEditor({ value, onChange, api }) {
  const editorRef = useRef(null);
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

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
    if (command === "underline")
      setFormats((p) => ({ ...p, underline: !p.underline }));
    if (command === "insertUnorderedList")
      setFormats((p) => ({ ...p, list: !p.list }));
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

  return (
    <div className="richtext-editor">
      <div className="rt-toolbar">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          title="Bold"
          className={`rt-btn ${formats.bold ? "active" : ""}`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          title="Italic"
          className={`rt-btn ${formats.italic ? "active" : ""}`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
          title="Underline"
          className={`rt-btn ${formats.underline ? "active" : ""}`}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertUnorderedList")}
          title="Bullet"
          className={`rt-btn ${formats.list ? "active" : ""}`}
        >
          • Lista
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertLink}
          title="Adicionar hiperligação"
          className="rt-btn rt-btn-link"
        >
          + adicionar hiperligacao
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleImagePick}
          title="Adicionar fotografia"
          className="rt-btn rt-btn-image"
        >
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
        onDoubleClick={(e) =>
          e.preventDefault()
        } /* prevent double-click from triggering format toggles */
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
                bold = document.queryCommandState("bold");
                italic = document.queryCommandState("italic");
                underline = document.queryCommandState("underline");
                list = document.queryCommandState("insertUnorderedList");
              } catch (e) {
                // fallback: inspect ancestor nodes
                const node = sel.anchorNode;
                const el =
                  node && node.nodeType === 3 ? node.parentElement : node;
                if (el) {
                  bold = !!el.closest && !!el.closest("strong, b");
                  italic = !!el.closest && !!el.closest("em, i");
                  underline = !!el.closest && !!el.closest("u");
                  list = !!el.closest && !!el.closest("ul, ol");
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
  const [selectedInstitutional, setSelectedInstitutional] = useState(null);
  const [selectedResposta, setSelectedResposta] = useState(null);
  const [secoesPersonalizadas, setSecoesPersonalizadas] = useState([]);
  const [itensSecoesPersonalizadas, setItensSecoesPersonalizadas] = useState(
    {}
  );
  const [loadingSecoes, setLoadingSecoes] = useState(true);
  const [editingSecaoPersonalizada, setEditingSecaoPersonalizada] =
    useState(null);
  const lastFocusedRef = useRef(null);
  const editModalRef = useRef(null);
  const addModalRef = useRef(null);
  const newsModalRef = useRef(null);

  // Upload cover image (imagem_destaque) and set editingData.imagem_destaque
  const uploadCoverImage = async (file) => {
    try {
      // show placeholder immediately while upload runs
      const placeholderBase =
        api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";

      const imagemField = editingSecaoPersonalizada
        ? "imagem"
        : "imagem_destaque";

      setEditingData((d) => ({
        ...d,
        [imagemField]: `${placeholderBase}${PLACEHOLDER_SVG}`,
      }));

      const formData = new FormData();
      formData.append("file", file);

      // Determinar tabela de referência baseada na seção
      let tabelaRef = "noticias_eventos";
      if (editingSecaoPersonalizada) {
        tabelaRef = "itens_secoes_personalizadas";
      } else if (editingSection === "respostas-sociais") {
        tabelaRef = "respostas_sociais";
      } else if (editingSection !== "noticias") {
        tabelaRef = "conteudo_institucional";
      }

      formData.append("tabela_referencia", tabelaRef);
      // id_referencia could be null for now
      const response = await api.post("/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let url = response.data?.data?.url;
      if (!url) throw new Error("Upload não retornou URL");
      const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
      url = url.startsWith("http") ? url : `${base}${url}`;
      setEditingData((d) => ({ ...d, [imagemField]: url }));
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
    { id: "transparencia", label: "Transparência" },
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

  // Documentos de Transparência
  const [transparenciaDocs, setTransparenciaDocs] = useState([]);
  const [loadingTransparencia, setLoadingTransparencia] = useState(false);
  const [showTranspModal, setShowTranspModal] = useState(false);
  const [transpSubmitting, setTranspSubmitting] = useState(false);
  const [transpError, setTranspError] = useState("");
  const [transpForm, setTranspForm] = useState({
    titulo: "",
    descricao: "",
    ano: new Date().getFullYear().toString(),
    tipo: "Relatorio",
    ficheiro: null,
  });

  const fetchTransparencia = async () => {
    try {
      setLoadingTransparencia(true);
      const { data } = await api.get("/transparencia");
      const docs = data?.data || [];
      const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
      const normalized = docs.map((doc) => {
        const url = doc.ficheiro_url?.startsWith("http")
          ? doc.ficheiro_url
          : `${base}${doc.ficheiro_url}`;
        return { ...doc, ficheiro_url: url };
      });
      setTransparenciaDocs(normalized);
    } catch (error) {
      console.error("Erro ao carregar transparência:", error);
    } finally {
      setLoadingTransparencia(false);
    }
  };

  useEffect(() => {
    fetchTransparencia();
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
            if (
              obj.imagem_destaque &&
              !obj.imagem_destaque.startsWith("http")
            ) {
              obj.imagem_destaque = `${base}${obj.imagem_destaque}`;
            }
            if (Array.isArray(obj.media)) {
              obj.media = obj.media.map((m) => ({
                ...m,
                url:
                  m.url && !m.url.startsWith("http")
                    ? `${base}${m.url}`
                    : m.url,
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

  // Buscar seções personalizadas
  useEffect(() => {
    const fetchSecoesPersonalizadas = async () => {
      try {
        setLoadingSecoes(true);
        const response = await api.get("/secoes-personalizadas");
        if (response.data.success) {
          const secoes = response.data.data || [];
          setSecoesPersonalizadas(secoes);

          // Buscar itens de cada seção
          const itensMap = {};
          for (const secao of secoes) {
            const itensResp = await api.get(
              `/secoes-personalizadas/${secao.id}/itens`
            );
            if (itensResp.data.success) {
              itensMap[secao.id] = itensResp.data.data || [];
            }
          }
          setItensSecoesPersonalizadas(itensMap);
        }
      } catch (error) {
        console.error("Erro ao carregar seções personalizadas:", error);
      } finally {
        setLoadingSecoes(false);
      }
    };

    fetchSecoesPersonalizadas();
  }, []);

  // Abrir modal de edição
  const handleEdit = (section, data = {}, id = null) => {
    lastFocusedRef.current = document.activeElement;
    setEditingSection(section);
    setEditingData(data);
    setEditingId(id);
    setShowEditModal(true);
  };

  // Adicionar nova subseção
  const handleAddSubsection = (
    section = "instituicao",
    secaoPersonalizadaData = null
  ) => {
    lastFocusedRef.current = document.activeElement;
    console.log("handleAddSubsection - section:", section);
    setEditingSection(section);

    if (secaoPersonalizadaData) {
      setEditingSecaoPersonalizada(secaoPersonalizadaData);
      setEditingData({ titulo: "", subtitulo: "", conteudo: "", imagem: "" });
    } else if (section === "respostas-sociais") {
      setEditingData({
        titulo: "",
        descricao: "",
        conteudo: "",
        imagem_destaque: "",
      });
    } else if (section === "noticias") {
      setEditingData({
        titulo: "",
        resumo: "",
        conteudo: "",
        tipo: "noticia",
        imagem_destaque: "",
      });
    } else {
      setEditingData({
        titulo: "",
        resumo: "",
        conteudo: "",
        imagem_destaque: "",
      });
    }
    setEditingId(null);
    setShowAddModal(true);
  };

  const goToTransparencyAdmin = () => {
    setShowTranspModal(true);
    setTranspError("");
    setTranspSubmitting(false);
    setTranspForm({
      titulo: "",
      descricao: "",
      ano: new Date().getFullYear().toString(),
      tipo: "Relatorio",
      ficheiro: null,
    });
  };

  const handleTranspChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "ficheiro") {
      setTranspForm((prev) => ({ ...prev, ficheiro: files?.[0] || null }));
    } else {
      setTranspForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTranspSubmit = async (e) => {
    e.preventDefault();
    setTranspError("");

    if (!transpForm.titulo.trim() || !transpForm.ano || !transpForm.ficheiro) {
      setTranspError("Preencha título, ano e selecione um ficheiro PDF.");
      return;
    }

    const allowedTipos = ["Relatorio", "Contas", "Relatorio_Atividades", "Outro"];
    const safeTipo = allowedTipos.includes(transpForm.tipo)
      ? transpForm.tipo
      : "Relatorio";

    const payload = new FormData();
    payload.append("titulo", transpForm.titulo.trim());
    payload.append("ano", transpForm.ano);
    payload.append("ficheiro", transpForm.ficheiro);
    if (transpForm.descricao.trim()) payload.append("descricao", transpForm.descricao.trim());
    payload.append("tipo", safeTipo);

    try {
      setTranspSubmitting(true);
      await api.post("/transparencia", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowTranspModal(false);
      await fetchTransparencia();
    } catch (error) {
      const msg =
        error.response?.data?.message || error.message || "Erro ao enviar documento.";
      setTranspError(msg);
    } finally {
      setTranspSubmitting(false);
    }
  };

  // Salvar nova subseção
  const handleSaveNew = async (e) => {
    e.preventDefault();
    try {
      let response;

      if (editingSecaoPersonalizada) {
        // Criar item de seção personalizada
        response = await api.post(
          `/secoes-personalizadas/${editingSecaoPersonalizada.id}/itens`,
          editingData
        );
        if (response.data.success) {
          // Atualizar lista de itens da seção
          setItensSecoesPersonalizadas({
            ...itensSecoesPersonalizadas,
            [editingSecaoPersonalizada.id]: [
              ...(itensSecoesPersonalizadas[editingSecaoPersonalizada.id] ||
                []),
              response.data.data,
            ],
          });
        }
        setEditingSecaoPersonalizada(null);
      } else if (editingSection === "respostas-sociais") {
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

  closeAddModal();
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
    lastFocusedRef.current = document.activeElement;
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

  const focusFirstElement = (ref) => {
    if (!ref?.current) return;
    const el = ref.current.querySelector(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    );
    if (el) el.focus();
  };

  useEffect(() => {
    if (showEditModal) {
      setTimeout(() => focusFirstElement(editModalRef), 0);
    }
  }, [showEditModal]);

  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => focusFirstElement(addModalRef), 0);
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showNewsModal) {
      setTimeout(() => focusFirstElement(newsModalRef), 0);
    }
  }, [showNewsModal]);

  const closeEditModal = () => {
    setShowEditModal(false);
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  };

  const closeNewsModal = () => {
    setShowNewsModal(false);
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
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
        closeEditModal();
        alert("Conteúdo atualizado com sucesso!");
      } else if (editingSection === "respostas-sociais" && editingId) {
        await api.put(`/respostas-sociais/${editingId}`, editingData);
        setRespostasSociais(
          respostasSociais.map((r) =>
            r.id === editingId ? { ...r, ...editingData } : r
          )
        );
        closeEditModal();
        alert("Resposta Social atualizada com sucesso!");
      } else if (editingSection === "noticias" && editingId) {
        await api.put(`/noticias/${editingId}`, editingData);
        setNoticias(
          noticias.map((n) =>
            n.id === editingId ? { ...n, ...editingData } : n
          )
        );
        closeEditModal();
        alert("Notícia atualizada com sucesso!");
      } else if (editingSection === "hero") {
        alert("Funcionalidade de edição do Hero será implementada");
        closeEditModal();
      } else if (editingSection === "contactos") {
        alert("Funcionalidade de edição de Contactos será implementada");
        closeEditModal();
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  return (
    <div className="home-page">
      <Header
        sections={sections}
        customSections={secoesPersonalizadas}
        isEditMode={isEditMode}
      />

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
                <div
                  key={content.id}
                  className="content-subsection"
                  onClick={() =>
                    !isEditMode && setSelectedInstitutional(content)
                  }
                  style={{ cursor: !isEditMode ? "pointer" : "default" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    !isEditMode &&
                    e.key === "Enter" &&
                    setSelectedInstitutional(content)
                  }
                >
                  <div className="subsection-header">
                    <h3>{content.titulo}</h3>
                    {isEditMode && user && (
                      <div className="subsection-actions">
                        <button
                          className="btn-edit-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit("institucional", content, content.id);
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(content.id, "instituicao");
                          }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  {content.imagem && (
                    <img
                      src={content.imagem}
                      alt={content.titulo}
                      className="content-image"
                      style={{ marginBottom: "1rem", maxWidth: "100%" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_SVG;
                      }}
                    />
                  )}
                  {content.subtitulo && (
                    <p
                      className="content-summary"
                      style={{ fontStyle: "italic", marginTop: 8 }}
                    >
                      {content.subtitulo}
                    </p>
                  )}
                  <div
                    className="content-preview"
                    dangerouslySetInnerHTML={{ __html: content.conteudo || "" }}
                  />
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
                <div
                  key={resposta.id}
                  className="content-subsection"
                  onClick={() => !isEditMode && setSelectedResposta(resposta)}
                  style={{ cursor: !isEditMode ? "pointer" : "default" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    !isEditMode &&
                    e.key === "Enter" &&
                    setSelectedResposta(resposta)
                  }
                >
                  <div className="subsection-header">
                    <h3>{resposta.titulo}</h3>
                    {isEditMode && user && (
                      <div className="subsection-actions">
                        <button
                          className="btn-edit-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(
                              "respostas-sociais",
                              resposta,
                              resposta.id
                            );
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(resposta.id, "respostas-sociais");
                          }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  {resposta.imagem_destaque && (
                    <img
                      src={resposta.imagem_destaque}
                      alt={resposta.titulo}
                      className="content-image"
                      style={{ marginBottom: "1rem", maxWidth: "100%" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_SVG;
                      }}
                    />
                  )}
                  {resposta.descricao && (
                    <p
                      className="content-summary"
                      style={{ fontStyle: "italic", marginTop: 8 }}
                    >
                      {resposta.descricao}
                    </p>
                  )}
                  <div
                    className="content-preview"
                    dangerouslySetInnerHTML={{
                      __html:
                        (
                          resposta.conteudo ||
                          resposta.descricao ||
                          ""
                        ).substring(0, 200) +
                        ((resposta.conteudo || resposta.descricao || "")
                          .length > 200
                          ? "..."
                          : ""),
                    }}
                  />
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
                        console.warn("Imagem não encontrada:", e.target.src);
                        e.target.src = PLACEHOLDER_SVG;
                      }}
                    />
                  )}

                  <div className="noticia-body">
                    <h3 className="noticia-title">{noticia.titulo}</h3>
                    <p className="noticia-summary">
                      {noticia.resumo ||
                        stripHtml(noticia.conteudo || "").slice(0, 200) + "..."}
                    </p>
                  </div>

                  <p className="noticia-date">
                    📅{" "}
                    {new Date(
                      noticia.data_publicacao || noticia.created_at
                    ).toLocaleDateString("pt-PT")}
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

      <section id="transparencia" className="section transparency-section">
        <div className="container">
          <div className="section-header-editable">
            <h2>Transparência</h2>
            {isEditMode && user && (
              <button
                className="btn-add-subsection"
                onClick={goToTransparencyAdmin}
                title="Adicionar documento de transparência"
              >
                + Adicionar
              </button>
            )}
          </div>

          {loadingTransparencia ? (
            <p>A carregar documentos...</p>
          ) : transparenciaDocs.length === 0 ? (
            <p>Ainda não foram publicados relatórios.</p>
          ) : (
            <div className="transparency-grid">
              {transparenciaDocs.map((doc) => (
                <div key={doc.id} className="transparency-card">
                  <div className="transparency-thumb">
                    <img
                      src={PDF_PLACEHOLDER}
                      alt={`Relatório ${doc.titulo || doc.ano || "PDF"}`}
                      loading="lazy"
                    />
                  </div>
                  <div className="transparency-meta">
                    <h3>{doc.titulo || `Contas ${doc.ano || ""}`}</h3>
                    <p className="transparency-date">
                      {doc.ano ? `Ano: ${doc.ano}` : ""}
                      {doc.data_criacao
                        ? `${doc.ano ? " · " : ""}${formatDate(doc.data_criacao)}`
                        : ""}
                    </p>
                    {doc.descricao && (
                      <p className="transparency-desc">{doc.descricao}</p>
                    )}
                    {doc.ficheiro_url && (
                      <button
                        className="btn-primary"
                        onClick={() => window.open(doc.ficheiro_url, "_blank")}
                      >
                        Ver ficheiro
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seções Personalizadas */}
      {secoesPersonalizadas.map((secao) => {
        const itens = itensSecoesPersonalizadas[secao.id] || [];

        return (
          <section key={secao.id} id={secao.slug} className="section">
            <div className="container">
              <div className="section-header-editable">
                <h2>
                  {secao.icone} {secao.titulo}
                </h2>
                {isEditMode && user && (
                  <button
                    className="btn-add-subsection"
                    onClick={() =>
                      handleAddSubsection("secao-personalizada", secao)
                    }
                    title="Adicionar item"
                  >
                    ➥ Adicionar
                  </button>
                )}
              </div>

              {secao.descricao && (
                <p style={{ marginBottom: "2rem", color: "#666" }}>
                  {secao.descricao}
                </p>
              )}

              {loadingSecoes ? (
                <p>A carregar...</p>
              ) : itens.length === 0 ? (
                <p>Nenhum conteúdo adicionado ainda.</p>
              ) : (
                <div
                  className={`institutional-content ${
                    secao.tipo_layout === "galeria" ? "gallery-grid" : ""
                  }`}
                >
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="content-subsection"
                      onClick={() =>
                        !isEditMode && item.link_externo
                          ? window.open(item.link_externo, "_blank")
                          : null
                      }
                      style={{
                        cursor:
                          !isEditMode && item.link_externo
                            ? "pointer"
                            : "default",
                      }}
                    >
                      {item.imagem && (
                        <img
                          src={item.imagem}
                          alt={item.titulo}
                          className="content-image"
                          style={{ marginBottom: "1rem", maxWidth: "100%" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_SVG;
                          }}
                        />
                      )}
                      {item.titulo && <h3>{item.titulo}</h3>}
                      {item.subtitulo && (
                        <p
                          style={{
                            fontStyle: "italic",
                            color: "#666",
                            marginTop: "0.5rem",
                          }}
                        >
                          {item.subtitulo}
                        </p>
                      )}
                      {item.conteudo && (
                        <div
                          className="content-preview"
                          dangerouslySetInnerHTML={{
                            __html:
                              item.conteudo.substring(0, 200) +
                              (item.conteudo.length > 200 ? "..." : ""),
                          }}
                        />
                      )}
                      {item.video_url && (
                        <video
                          controls
                          className="content-video"
                          style={{ marginTop: "1rem", maxWidth: "100%" }}
                        >
                          <source src={item.video_url} type="video/mp4" />
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

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
                    const resp = await api.post("/contactos/form", data);
                    if (resp.data && resp.data.success) {
                      alert("Mensagem enviada. Obrigado!");
                      form.reset();
                    } else {
                      alert("Erro ao enviar mensagem.");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Erro ao enviar mensagem.");
                  }
                }}
              >
                <div className="form-row">
                  <div className="form-field name-field">
                    <label htmlFor="nome">Nome</label>
                    <div className="input-with-icon">
                      <span className="input-icon">👤</span>
                      <input
                        id="nome"
                        name="nome"
                        placeholder="Nome"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field email-field">
                    <label htmlFor="email">Email</label>
                    <div className="input-with-icon">
                      <span className="input-icon">✉️</span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-field subject-field">
                  <label htmlFor="assunto">Assunto</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📝</span>
                    <input
                      id="assunto"
                      name="assunto"
                      placeholder="Assunto"
                      required
                    />
                  </div>
                </div>

                <div className="form-field message-field">
                  <label htmlFor="mensagem">Mensagem</label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    rows="6"
                    placeholder="Mensagem"
                    required
                  />
                </div>

                <div className="form-actions" style={{ marginTop: 10 }}>
                  <button type="submit" className="btn-save">
                    Enviar Mensagem
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {showTranspModal && (
        <div
          className="edit-modal-overlay"
          onClick={() => setShowTranspModal(false)}
        >
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-modal-header">
              <h3>Adicionar documento de transparência</h3>
              <button className="btn-close" onClick={() => setShowTranspModal(false)}>
                ✕
              </button>
            </div>

            <form className="edit-modal-body" onSubmit={handleTranspSubmit}>
              <div className="form-group">
                <label htmlFor="transp-titulo">Título *</label>
                <input
                  id="transp-titulo"
                  name="titulo"
                  type="text"
                  value={transpForm.titulo}
                  onChange={handleTranspChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transp-ano">Ano *</label>
                  <input
                    id="transp-ano"
                    name="ano"
                    type="number"
                    min="2000"
                    max="2100"
                    value={transpForm.ano}
                    onChange={handleTranspChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="transp-tipo">Tipo</label>
                  <select
                    id="transp-tipo"
                    name="tipo"
                    value={transpForm.tipo}
                    onChange={handleTranspChange}
                  >
                    <option value="Relatorio">Relatório & Contas</option>
                    <option value="Contas">Contas</option>
                    <option value="Relatorio_Atividades">Relatório de Atividades</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="transp-descricao">Descrição (opcional)</label>
                <textarea
                  id="transp-descricao"
                  name="descricao"
                  rows="3"
                  value={transpForm.descricao}
                  onChange={handleTranspChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="transp-ficheiro">Ficheiro PDF *</label>
                <input
                  id="transp-ficheiro"
                  name="ficheiro"
                  type="file"
                  accept="application/pdf"
                  onChange={handleTranspChange}
                  required
                />
                {transpForm.ficheiro && (
                  <small>Selecionado: {transpForm.ficheiro.name}</small>
                )}
              </div>

              {transpError && <div className="alert alert-error">{transpError}</div>}

              <div className="form-actions" style={{ gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTranspModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={transpSubmitting}>
                  {transpSubmitting ? "A enviar..." : "Guardar documento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          onClick={closeEditModal}
        >
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
            ref={editModalRef}
          >
            <div className="edit-modal-header">
              <h3>
                Editar{" "}
                {editingSection === "institucional"
                  ? "Instituição"
                  : editingSection}
              </h3>
              <button
                className="btn-close"
                onClick={closeEditModal}
              >
                ✕
              </button>
            </div>
            <div className="edit-modal-body">
              {editingSection === "institucional" && (
                <>
                  <div className="cover-image-upload">
                    <label>
                      <strong>Imagem de Capa:</strong>
                      <div className="cover-preview-row">
                        {editingData.imagem ? (
                          <img
                            src={editingData.imagem}
                            alt="Capa"
                            className="cover-preview"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_SVG;
                            }}
                          />
                        ) : (
                          <div className="cover-placeholder">
                            Nenhuma imagem de capa
                          </div>
                        )}
                        <div className="cover-actions">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files[0];
                              if (f) {
                                try {
                                  const formData = new FormData();
                                  formData.append("file", f);
                                  formData.append(
                                    "tabela_referencia",
                                    "conteudo_institucional"
                                  );
                                  const response = await api.post(
                                    "/media",
                                    formData,
                                    {
                                      headers: {
                                        "Content-Type": "multipart/form-data",
                                      },
                                    }
                                  );
                                  let url = response.data?.data?.url;
                                  if (url) {
                                    const base =
                                      api.defaults.baseURL?.replace(
                                        /\/api\/?$/,
                                        ""
                                      ) || "";
                                    url = url.startsWith("http")
                                      ? url
                                      : `${base}${url}`;
                                    setEditingData((d) => ({
                                      ...d,
                                      imagem: url,
                                    }));
                                  }
                                } catch (err) {
                                  console.error("Erro ao enviar imagem:", err);
                                  alert("Erro ao enviar imagem.");
                                }
                              }
                            }}
                          />
                          <small className="hint">Enviar imagem de capa</small>
                        </div>
                      </div>
                    </label>
                  </div>
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
                    <strong>Resumo/Descrição Breve:</strong>
                    <textarea
                      value={editingData.subtitulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          subtitulo: e.target.value,
                        })
                      }
                      rows="2"
                      placeholder="Descrição breve"
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
                          <div className="cover-placeholder">
                            Nenhuma imagem de capa
                          </div>
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
                          <small className="hint">Enviar imagem de capa</small>
                        </div>
                      </div>
                    </label>
                  </div>

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

                  <label>
                    <strong>
                      {editingSection === "noticias"
                        ? "Resumo:"
                        : "Descrição Breve:"}
                      :
                    </strong>
                    <textarea
                      value={
                        editingSection === "respostas-sociais"
                          ? editingData.descricao || ""
                          : editingData.resumo || ""
                      }
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          [editingSection === "respostas-sociais"
                            ? "descricao"
                            : "resumo"]: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder={
                        editingSection === "noticias"
                          ? "Resumo da notícia"
                          : "Descrição breve da resposta social"
                      }
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
                onClick={closeEditModal}
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
        <div
          className="edit-modal-overlay"
          onClick={closeNewsModal}
        >
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
            ref={newsModalRef}
          >
            <div className="edit-modal-header">
              <h3>{selectedNews.titulo}</h3>
              <button
                className="btn-close"
                onClick={closeNewsModal}
              >
                ✕
              </button>
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
                <p className="noticia-summary" style={{ marginTop: 8 }}>
                  {selectedNews.resumo}
                </p>
              )}

              {/* Conteúdo HTML */}
              <div
                className="noticia-conteudo"
                dangerouslySetInnerHTML={{
                  __html: selectedNews.conteudo || "",
                }}
              />

              {/* Imagens adicionais associadas (media) */}
              {selectedNews.media && selectedNews.media.length > 0 && (
                <div className="noticia-media-gallery">
                  {selectedNews.media
                    .filter(
                      (m) =>
                        m.url !== selectedNews.imagem_destaque &&
                        (!m.tipo || m.tipo.includes("imagem"))
                    )
                    .map((m) => (
                      <img
                        key={m.id || m.url}
                        src={m.url}
                        alt={m.titulo || "imagem"}
                        className="noticia-additional-image"
                        onError={(e) => {
                          console.warn(
                            "Imagem adicional não encontrada:",
                            e.target.src
                          );
                          e.target.src = PLACEHOLDER_SVG;
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
            <div
              className="edit-modal-footer"
              style={{ justifyContent: "space-between" }}
            >
              <div />
              <div style={{ textAlign: "right" }}>
                <small className="project-date">
                  📅{" "}
                  {new Date(
                    selectedNews.data_publicacao || selectedNews.created_at
                  ).toLocaleDateString("pt-PT")}
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conteúdo Institucional */}
      {selectedInstitutional && (
        <div
          className="edit-modal-overlay"
          onClick={() => setSelectedInstitutional(null)}
        >
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>{selectedInstitutional.titulo}</h3>
              <button
                className="btn-close"
                onClick={() => setSelectedInstitutional(null)}
              >
                ✕
              </button>
            </div>
            <div className="edit-modal-body">
              {selectedInstitutional.imagem && (
                <img
                  src={selectedInstitutional.imagem}
                  alt={selectedInstitutional.titulo}
                  className="content-image"
                  style={{ marginBottom: "1rem", maxWidth: "100%" }}
                />
              )}
              <h3 style={{ marginTop: 12 }}>{selectedInstitutional.titulo}</h3>
              {selectedInstitutional.subtitulo && (
                <p
                  className="noticia-summary"
                  style={{ marginTop: 8, fontStyle: "italic" }}
                >
                  {selectedInstitutional.subtitulo}
                </p>
              )}
              <div
                className="noticia-conteudo"
                dangerouslySetInnerHTML={{
                  __html: selectedInstitutional.conteudo || "",
                }}
              />
              {selectedInstitutional.video_url && (
                <video
                  controls
                  className="content-video"
                  style={{ marginTop: "1rem", maxWidth: "100%" }}
                >
                  <source
                    src={selectedInstitutional.video_url}
                    type="video/mp4"
                  />
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Resposta Social */}
      {selectedResposta && (
        <div
          className="edit-modal-overlay"
          onClick={() => setSelectedResposta(null)}
        >
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>{selectedResposta.titulo}</h3>
              <button
                className="btn-close"
                onClick={() => setSelectedResposta(null)}
              >
                ✕
              </button>
            </div>
            <div className="edit-modal-body">
              {selectedResposta.imagem_destaque && (
                <img
                  src={selectedResposta.imagem_destaque}
                  alt={selectedResposta.titulo}
                  className="content-image"
                  style={{ marginBottom: "1rem", maxWidth: "100%" }}
                />
              )}
              <h3 style={{ marginTop: 12 }}>{selectedResposta.titulo}</h3>
              {selectedResposta.descricao && (
                <p
                  className="noticia-summary"
                  style={{ marginTop: 8, fontStyle: "italic" }}
                >
                  {selectedResposta.descricao}
                </p>
              )}
              <div
                className="noticia-conteudo"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedResposta.conteudo ||
                    selectedResposta.descricao ||
                    "",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Subseção */}
      {showAddModal && (
        <div
          className="edit-modal-overlay"
          onClick={closeAddModal}
        >
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
            ref={addModalRef}
          >
            <div className="edit-modal-header">
              <h3>
                Adicionar{" "}
                {editingSecaoPersonalizada
                  ? `Item - ${editingSecaoPersonalizada.titulo}`
                  : editingSection === "respostas-sociais"
                  ? "Resposta Social"
                  : editingSection === "noticias"
                  ? "Notícia"
                  : "Subseção Institucional"}
              </h3>
              <button
                className="btn-close"
                onClick={closeAddModal}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveNew}>
              <div className="edit-modal-body">
                {/* Cover image - para todas as seções exceto contactos */}
                {editingSection !== "contactos" &&
                  editingSection !== "projetos" && (
                    <div className="cover-image-upload">
                      <label>
                        <strong>Imagem de Capa:</strong>
                        <div className="cover-preview-row">
                          {(
                            editingSecaoPersonalizada
                              ? editingData.imagem
                              : editingData.imagem_destaque
                          ) ? (
                            <img
                              src={
                                editingSecaoPersonalizada
                                  ? editingData.imagem
                                  : editingData.imagem_destaque
                              }
                              alt="Capa"
                              className="cover-preview"
                              onError={(e) => {
                                e.target.src = PLACEHOLDER_SVG;
                              }}
                            />
                          ) : (
                            <div className="cover-placeholder">
                              Nenhuma imagem de capa
                            </div>
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
                            <small className="hint">
                              Enviar imagem de capa (aparece antes do título)
                            </small>
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

                {/* Resumo/Descrição - para todas as seções */}
                {editingSection !== "contactos" &&
                  editingSection !== "projetos" && (
                    <label>
                      <strong>
                        {editingSection === "noticias"
                          ? "Resumo:"
                          : "Descrição Breve:"}
                      </strong>
                      <textarea
                        value={
                          editingSection === "respostas-sociais"
                            ? editingData.descricao || ""
                            : editingData.resumo || ""
                        }
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            [editingSection === "respostas-sociais"
                              ? "descricao"
                              : "resumo"]: e.target.value,
                          })
                        }
                        rows="3"
                        placeholder={
                          editingSection === "noticias"
                            ? "Breve resumo da notícia"
                            : editingSection === "respostas-sociais"
                            ? "Breve descrição da resposta social"
                            : "Breve descrição"
                        }
                      />
                    </label>
                  )}

                {/* Conteúdo com Rich Text Editor - para todas as seções */}
                {editingSection !== "contactos" &&
                  editingSection !== "projetos" && (
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
                  )}
              </div>
              <div className="edit-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeAddModal}
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
