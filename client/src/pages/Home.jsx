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

// Configuração de formulário (contacto/ERPI) armazenada como JSON no backend
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

const FORM_TYPE_LABELS = {
  contacto: "Formulário de contacto",
  erpi: "Inscrição ERPI",
  creche: "Inscrição Creche",
  centro_de_dia: "Inscrição Centro de Dia",
  sad: "Inscrição SAD",
};

const POSTAL_PATTERN = "\\d{4}-\\d{3}";
const POSTAL_TITLE = "Formato 0000-000";
const DATE_MIN = "1900-01-01";
const DATE_MAX = new Date().toISOString().slice(0, 10);
const DATE_FUTURE_MAX = "2100-12-31";

const normalizeFormOptions = (opcoes = []) => {
  return opcoes
    .filter(Boolean)
    .map((opt, idx) => {
      const tipo = opt?.tipo || opt?.id || opt?.value || opt;
      return {
        tipo,
        label:
          opt?.label || FORM_TYPE_LABELS[tipo] || `Formulário ${idx + 1}`,
      };
    });
};

const getFormConfig = (secao) => {
  const hasForm = secao?.tem_formulario || secao?.config_formulario;
  if (!hasForm) return null;

  const cfg = parseFormConfig(secao.config_formulario);

  if (cfg?.tipo === "multiple") {
    const opcoes = normalizeFormOptions(cfg.opcoes || []);
    if (!opcoes.length) return null;
    return {
      tipo: "multiple",
      opcoes,
      titulo: cfg.titulo || "Escolha o formulário",
      descricao: cfg.descricao || "",
    };
  }

  const tipo = cfg?.tipo || (secao?.tem_formulario ? "contacto" : null);
  if (!tipo || tipo === "nenhum") return null;

  return {
    tipo,
    label: cfg?.label || FORM_TYPE_LABELS[tipo] || tipo,
  };
};

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
  const [selectedCustomItem, setSelectedCustomItem] = useState(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [formSelections, setFormSelections] = useState({});
  const [crecheSelecao, setCrecheSelecao] = useState({});
  const [crecheNasceuState, setCrecheNasceuState] = useState({});
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
          const secoes = (response.data.data || []).map((s) => ({
            ...s,
            config_formulario: parseFormConfig(s.config_formulario),
          }));
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

  useEffect(() => {
    const defaults = {};
    secoesPersonalizadas.forEach((secao) => {
      const cfg = getFormConfig(secao);
      if (!cfg) return;
      if (cfg.tipo === "multiple") {
        const first = cfg.opcoes?.[0]?.tipo;
        if (first) defaults[secao.id] = first;
      } else if (cfg.tipo) {
        defaults[secao.id] = cfg.tipo;
      }
    });
    setFormSelections((prev) => ({ ...defaults, ...prev }));
  }, [secoesPersonalizadas]);

  // Abrir modal de edição
  const handleEdit = (
    section,
    data = {},
    id = null,
    secaoPersonalizadaData = null
  ) => {
    lastFocusedRef.current = document.activeElement;
    setEditingSection(section);
    setEditingData(data);
    setEditingId(id);
    if (secaoPersonalizadaData) {
      setEditingSecaoPersonalizada(secaoPersonalizadaData);
    }
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

    const allowedTipos = [
      "Relatorio",
      "Contas",
      "Relatorio_Atividades",
      "Outro",
    ];
    const safeTipo = allowedTipos.includes(transpForm.tipo)
      ? transpForm.tipo
      : "Relatorio";

    const payload = new FormData();
    payload.append("titulo", transpForm.titulo.trim());
    payload.append("ano", transpForm.ano);
    payload.append("ficheiro", transpForm.ficheiro);
    if (transpForm.descricao.trim())
      payload.append("descricao", transpForm.descricao.trim());
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
        error.response?.data?.message ||
        error.message ||
        "Erro ao enviar documento.";
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
  const handleDelete = async (id, section, secaoId = null) => {
    if (!window.confirm("Tem certeza que deseja eliminar este item?")) {
      return;
    }
    try {
      if (section === "secao-personalizada" && secaoId) {
        await api.delete(`/secoes-personalizadas/${secaoId}/itens/${id}`);
        setItensSecoesPersonalizadas({
          ...itensSecoesPersonalizadas,
          [secaoId]: (itensSecoesPersonalizadas[secaoId] || []).filter(
            (item) => item.id !== id
          ),
        });
      } else if (section === "respostas-sociais") {
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

  const openCustomItem = (item) => {
    lastFocusedRef.current = document.activeElement;
    setSelectedCustomItem(item);
    setShowCustomItemModal(true);
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
      if (
        editingSection === "secao-personalizada" &&
        editingId &&
        editingSecaoPersonalizada
      ) {
        await api.put(
          `/secoes-personalizadas/${editingSecaoPersonalizada.id}/itens/${editingId}`,
          editingData
        );
        setItensSecoesPersonalizadas({
          ...itensSecoesPersonalizadas,
          [editingSecaoPersonalizada.id]: (
            itensSecoesPersonalizadas[editingSecaoPersonalizada.id] || []
          ).map((item) =>
            item.id === editingId ? { ...item, ...editingData } : item
          ),
        });
        closeEditModal();
        alert("Item atualizado com sucesso!");
      } else if (editingSection === "institucional" && editingId) {
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
                        ? `${doc.ano ? " · " : ""}${formatDate(
                            doc.data_criacao
                          )}`
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
        const formConfig = getFormConfig(secao);
        const isMultipleForm = formConfig?.tipo === "multiple";
        const formOptions = isMultipleForm
          ? formConfig.opcoes || []
          : formConfig
          ? [{ tipo: formConfig.tipo, label: formConfig.label }]
          : [];
        const selectedFormType = formConfig
          ? isMultipleForm
            ? formSelections[secao.id] || formOptions[0]?.tipo
            : formOptions[0]?.tipo
          : null;
        const selectedFormLabel = formOptions.find(
          (o) => o.tipo === selectedFormType
        )?.label;

        const crecheSections = secoesPersonalizadas.filter((s) => {
          const key = `${s.slug || ""} ${s.nome || ""} ${s.titulo || ""}`.toLowerCase();
          return key.includes("creche");
        });
        const crecheOptions = (
          crecheSections.flatMap((s) => {
            const items = itensSecoesPersonalizadas[s.id] || [];
            return items.map((it, idx) => ({
              id: it.id,
              label: it.titulo || it.nome || `Creche ${idx + 1}`,
            }));
          }) || []
        ).filter(Boolean);
        const crecheOptionsWithAmbas = [
          { id: "ambas", label: "Ambas" },
          ...crecheOptions,
        ];
        const selectedCreche =
          crecheSelecao[secao.id] || crecheOptionsWithAmbas[0]?.id || "ambas";

        return (
          <section key={secao.id} id={secao.slug} className="section">
            <div className="container">
              <div className="section-header-editable">
                <h2>{secao.titulo}</h2>
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
              ) : secao.tipo_layout === "texto" ? (
                /* Layout TEXTO - Mostra tudo expandido (como Valores) */
                <div className="text-layout-content">
                  {itens.map((item) => (
                    <div key={item.id} className="text-item-full">
                      {isEditMode && user && (
                        <div
                          className="subsection-actions"
                          style={{ float: "right" }}
                        >
                          <button
                            className="btn-edit-inline"
                            onClick={() =>
                              handleEdit(
                                "secao-personalizada",
                                item,
                                item.id,
                                secao
                              )
                            }
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete-inline"
                            onClick={() =>
                              handleDelete(
                                item.id,
                                "secao-personalizada",
                                secao.id
                              )
                            }
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                      {item.titulo && <h3>{item.titulo}</h3>}
                      {item.imagem && (
                        <img
                          src={item.imagem}
                          alt={item.titulo}
                          style={{
                            maxWidth: "100%",
                            marginBottom: "1rem",
                            borderRadius: "8px",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_SVG;
                          }}
                        />
                      )}
                      {item.conteudo && (
                        <div
                          className="text-content-full"
                          dangerouslySetInnerHTML={{ __html: item.conteudo }}
                        />
                      )}
                      {item.video_url && (
                        <video
                          controls
                          style={{ maxWidth: "100%", marginTop: "1rem" }}
                        >
                          <source src={item.video_url} type="video/mp4" />
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              ) : secao.tipo_layout === "galeria" ? (
                /* Layout GALERIA - Grid de imagens clicáveis */
                <div className="gallery-grid">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="gallery-item"
                      onClick={(e) => {
                        // Não abrir se clicou num botão
                        if (e.target.closest(".subsection-actions")) return;
                        openCustomItem(item);
                      }}
                      style={{ cursor: "pointer" }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.target.closest(".subsection-actions")
                        ) {
                          openCustomItem(item);
                        }
                      }}
                    >
                      {isEditMode && user && (
                        <div className="subsection-actions">
                          <button
                            className="btn-edit-inline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(
                                "secao-personalizada",
                                item,
                                item.id,
                                secao
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
                              handleDelete(
                                item.id,
                                "secao-personalizada",
                                secao.id
                              );
                            }}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                      {item.imagem ? (
                        <img
                          src={item.imagem}
                          alt={item.titulo || "Imagem"}
                          className="gallery-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_SVG;
                          }}
                        />
                      ) : (
                        <div className="gallery-placeholder">
                          {item.titulo || "Sem imagem"}
                        </div>
                      )}
                      {item.titulo && (
                        <div className="gallery-title">{item.titulo}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : secao.tipo_layout === "lista" ? (
                /* Layout LISTA - Lista vertical clicável */
                <div className="list-layout">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="list-item"
                      onClick={(e) => {
                        // Não abrir se clicou num botão
                        if (e.target.closest(".subsection-actions")) return;
                        openCustomItem(item);
                      }}
                      style={{ cursor: "pointer" }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.target.closest(".subsection-actions")
                        ) {
                          openCustomItem(item);
                        }
                      }}
                    >
                      <div className="list-item-header">
                        {item.titulo && <h3>{item.titulo}</h3>}
                        {isEditMode && user && (
                          <div className="subsection-actions">
                            <button
                              className="btn-edit-inline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(
                                  "secao-personalizada",
                                  item,
                                  item.id,
                                  secao
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
                                handleDelete(
                                  item.id,
                                  "secao-personalizada",
                                  secao.id
                                );
                              }}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                      {item.subtitulo && (
                        <p className="list-item-description">
                          {item.subtitulo}
                        </p>
                      )}
                      <span className="list-item-more">Ver mais →</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Layout CARDS (padrão) - Grid de cards clicáveis */
                <div className="institutional-content">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="content-subsection"
                      onClick={(e) => {
                        // Não abrir se clicou num botão
                        if (e.target.closest(".subsection-actions")) return;
                        if (item.link_externo) {
                          window.open(item.link_externo, "_blank");
                        } else {
                          openCustomItem(item);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.target.closest(".subsection-actions")
                        ) {
                          if (item.link_externo) {
                            window.open(item.link_externo, "_blank");
                          } else {
                            openCustomItem(item);
                          }
                        }
                      }}
                    >
                      <div className="subsection-header">
                        {item.titulo && <h3>{item.titulo}</h3>}
                        {isEditMode && user && (
                          <div className="subsection-actions">
                            <button
                              className="btn-edit-inline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(
                                  "secao-personalizada",
                                  item,
                                  item.id,
                                  secao
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
                                handleDelete(
                                  item.id,
                                  "secao-personalizada",
                                  secao.id
                                );
                              }}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
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
                              item.conteudo.substring(0, 150) +
                              (item.conteudo.length > 150 ? "..." : ""),
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Formulários configuráveis por secção */}
              {formConfig && selectedFormType && (
                <div
                  className="contact-form"
                  style={{ marginTop: "3rem", position: "relative" }}
                >
                  {isEditMode && user && (
                    <button
                      className="btn-delete-inline"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Tem certeza que deseja remover o formulário desta secção?"
                          )
                        ) {
                          try {
                            await api.put(`/secoes-personalizadas/${secao.id}`, {
                              ...secao,
                              tem_formulario: false,
                              config_formulario: null,
                            });
                            setSecoesPersonalizadas(
                              secoesPersonalizadas.map((s) =>
                                s.id === secao.id
                                  ? {
                                      ...s,
                                      tem_formulario: false,
                                      config_formulario: null,
                                    }
                                  : s
                              )
                            );
                            alert("Formulário removido com sucesso!");
                          } catch (error) {
                            console.error("Erro ao remover formulário:", error);
                            alert("Erro ao remover formulário.");
                          }
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        zIndex: 10,
                      }}
                      title="Remover formulário"
                    >
                      🗑️
                    </button>
                  )}

                  {isMultipleForm && formOptions.length > 1 && (
                    <div className="form-selector">
                      <p className="form-selector-title">
                        {formConfig.titulo || "Escolha o formulário"}
                      </p>
                      {formConfig.descricao && (
                        <p className="form-selector-description">
                          {formConfig.descricao}
                        </p>
                      )}
                      <div className="form-selector-options">
                        {formOptions.map((opt) => (
                          <label
                            key={opt.tipo}
                            className={`form-option-card ${
                              selectedFormType === opt.tipo ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`form-choice-${secao.id}`}
                              value={opt.tipo}
                              checked={selectedFormType === opt.tipo}
                              onChange={() =>
                                setFormSelections((prev) => ({
                                  ...prev,
                                  [secao.id]: opt.tipo,
                                }))
                              }
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFormType === "contacto" && (
                    <>
                      <h3>{selectedFormLabel || "Envie-nos uma mensagem"}</h3>
                      <form
                        className="erpi-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const data = {
                            nome: form.nome.value,
                            email: form.email.value,
                            assunto: form.assunto.value,
                            mensagem: form.mensagem.value,
                            secao_personalizada_id: secao.id,
                            formulario_escolhido:
                              selectedFormLabel || selectedFormType,
                          };
                          try {
                            const resp = await api.post(
                              "/contactos/form",
                              data
                            );
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
                            <label htmlFor={`nome-${secao.id}`}>Nome</label>
                            <div className="input-with-icon">
                              <span className="input-icon">👤</span>
                              <input
                                id={`nome-${secao.id}`}
                                name="nome"
                                placeholder="Nome"
                                required
                              />
                            </div>
                          </div>

                          <div className="form-field email-field">
                            <label htmlFor={`email-${secao.id}`}>
                              Email
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">✉️</span>
                              <input
                                id={`email-${secao.id}`}
                                name="email"
                                type="email"
                                placeholder="Email"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-field subject-field">
                          <label htmlFor={`assunto-${secao.id}`}>
                            Assunto
                          </label>
                          <div className="input-with-icon">
                            <span className="input-icon">📝</span>
                            <input
                              id={`assunto-${secao.id}`}
                              name="assunto"
                              placeholder="Assunto"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-field message-field">
                          <label htmlFor={`mensagem-${secao.id}`}>
                            Mensagem
                          </label>
                          <textarea
                            id={`mensagem-${secao.id}`}
                            name="mensagem"
                            rows="6"
                            placeholder="Mensagem"
                            required
                          />
                        </div>

                        <div
                          className="form-actions"
                          style={{ marginTop: 10 }}
                        >
                          <button type="submit" className="btn-save">
                            Enviar Mensagem
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {selectedFormType === "erpi" && (
                    <>
                      <h3>{selectedFormLabel || "Formulário ERPI"}</h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const data = {
                            nome_completo: form.nome_completo.value,
                            data_nascimento: form.data_nascimento.value,
                            morada_completa: form.morada_completa.value,
                            codigo_postal: form.codigo_postal.value,
                            concelho: form.concelho.value,
                            distrito: form.distrito.value,
                            cc_bi_numero: form.cc_bi_numero.value,
                            nif: form.nif.value,
                            niss: form.niss.value,
                            numero_utente: form.numero_utente.value,
                            contacto_nome_completo: form.contacto_nome_completo.value,
                            contacto_telefone: form.contacto_telefone.value,
                            contacto_email: form.contacto_email.value,
                            contacto_parentesco: form.contacto_parentesco.value,
                            observacoes: form.observacoes.value,
                            origem_submissao: "site-secao-personalizada",
                            secao_personalizada_id: secao.id,
                            formulario_escolhido:
                              selectedFormLabel || selectedFormType,
                          };

                          if (
                            !data.nome_completo ||
                            !data.data_nascimento ||
                            !data.morada_completa ||
                            !data.codigo_postal ||
                            !data.concelho ||
                            !data.distrito ||
                            !data.cc_bi_numero ||
                            !data.nif ||
                            !data.niss ||
                            !data.numero_utente ||
                            !data.contacto_nome_completo ||
                            !data.contacto_telefone ||
                            !data.contacto_email ||
                            !data.contacto_parentesco
                          ) {
                            alert("Preencha todos os campos obrigatórios.");
                            return;
                          }

                          try {
                            const resp = await api.post("/forms/erpi", data);
                            if (resp.data?.success) {
                              alert(
                                "Inscrição ERPI enviada. Entraremos em contacto."
                              );
                              form.reset();
                            } else {
                              alert("Erro ao enviar inscrição.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao enviar inscrição.");
                          }
                        }}
                      >
                        <div className="form-row">
                          <div className="form-field name-field">
                            <label htmlFor={`nome_completo-${secao.id}`}>
                              Nome completo
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">👤</span>
                              <input
                                id={`nome_completo-${secao.id}`}
                                name="nome_completo"
                                placeholder="Nome completo"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`data_nascimento-${secao.id}`}>
                              Data de nascimento
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">📅</span>
                              <input
                                id={`data_nascimento-${secao.id}`}
                                name="data_nascimento"
                                type="date"
                                min={DATE_MIN}
                                max={DATE_MAX}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`morada_completa-${secao.id}`}>
                              Morada completa
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏠</span>
                              <input
                                id={`morada_completa-${secao.id}`}
                                name="morada_completa"
                                placeholder="Rua, nº, andar"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`codigo_postal-${secao.id}`}>
                              Código Postal
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏷️</span>
                              <input
                                id={`codigo_postal-${secao.id}`}
                                name="codigo_postal"
                                placeholder="0000-000"
                                pattern={POSTAL_PATTERN}
                                title={POSTAL_TITLE}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`concelho-${secao.id}`}>
                              Concelho
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏘️</span>
                              <input
                                id={`concelho-${secao.id}`}
                                name="concelho"
                                placeholder="Concelho"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`distrito-${secao.id}`}>
                              Distrito
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🗺️</span>
                              <input
                                id={`distrito-${secao.id}`}
                                name="distrito"
                                placeholder="Distrito"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`cc_bi_numero-${secao.id}`}>
                              CC/BI Nº
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🪪</span>
                              <input
                                id={`cc_bi_numero-${secao.id}`}
                                name="cc_bi_numero"
                                placeholder="Número do CC/BI"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`nif-${secao.id}`}>
                              NIF
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input
                                id={`nif-${secao.id}`}
                                name="nif"
                                placeholder="NIF"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`niss-${secao.id}`}>
                              NISS
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input
                                id={`niss-${secao.id}`}
                                name="niss"
                                placeholder="NISS"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`numero_utente-${secao.id}`}>
                              Nº Utente de Saúde
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">💳</span>
                              <input
                                id={`numero_utente-${secao.id}`}
                                name="numero_utente"
                                placeholder="Número de utente"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`contacto_nome_completo-${secao.id}`}>
                              Nome do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">👥</span>
                              <input
                                id={`contacto_nome_completo-${secao.id}`}
                                name="contacto_nome_completo"
                                placeholder="Quem podemos contactar?"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`contacto_telefone-${secao.id}`}>
                              Telefone do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">☎️</span>
                              <input
                                id={`contacto_telefone-${secao.id}`}
                                name="contacto_telefone"
                                placeholder="Telefone"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`contacto_email-${secao.id}`}>
                              Email do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">✉️</span>
                              <input
                                id={`contacto_email-${secao.id}`}
                                name="contacto_email"
                                type="email"
                                placeholder="email@exemplo.pt"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`contacto_parentesco-${secao.id}`}>
                              Grau de parentesco
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🤝</span>
                              <input
                                id={`contacto_parentesco-${secao.id}`}
                                name="contacto_parentesco"
                                placeholder="Filho, filha, irmão, etc."
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-field">
                          <label htmlFor={`observacoes-${secao.id}`}>
                            Observações / necessidades específicas
                          </label>
                          <textarea
                            id={`observacoes-${secao.id}`}
                            name="observacoes"
                            rows="4"
                            placeholder="Medicações, alergias, mobilidade, etc."
                          />
                        </div>

                        <div
                          className="form-actions"
                          style={{ marginTop: 10 }}
                        >
                          <button type="submit" className="btn-save">
                            Enviar inscrição ERPI
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {selectedFormType === "creche" && (
                    <>
                      <h3>{selectedFormLabel || "Formulário Creche"}</h3>
                      <form
                        className="contact-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;

                          const selectedCrecheInput = form.querySelector(
                            'input[name="creche_item_id"]:checked'
                          );
                          const creche_item_id_value =
                            selectedCrecheInput?.value &&
                            selectedCrecheInput.value !== "ambas"
                              ? selectedCrecheInput.value
                              : "";
                          const creche_opcao_label =
                            selectedCrecheInput?.dataset.label ||
                            selectedCrecheInput?.value ||
                            "";

                          const crianca_nasceu = form.crianca_nasceu.value === "sim";

                          const data = {
                            creche_opcao: creche_opcao_label,
                            creche_item_id: creche_item_id_value,
                            nome_completo: form.nome_completo.value,
                            morada: form.morada.value,
                            codigo_postal: form.codigo_postal.value,
                            localidade: form.localidade.value,
                            crianca_nasceu,
                            data_nascimento: crianca_nasceu
                              ? form.data_nascimento.value
                              : "",
                            data_prevista: !crianca_nasceu
                              ? form.data_prevista.value
                              : "",
                            cc_bi_numero: form.cc_bi_numero.value,
                            nif: form.nif.value,
                            niss: form.niss.value,
                            numero_utente: form.numero_utente.value,
                            mae_nome: form.mae_nome.value,
                            mae_profissao: form.mae_profissao.value,
                            mae_local_emprego: form.mae_local_emprego.value,
                            mae_morada: form.mae_morada.value,
                            mae_codigo_postal: form.mae_codigo_postal.value,
                            mae_localidade: form.mae_localidade.value,
                            mae_telemovel: form.mae_telemovel.value,
                            mae_email: form.mae_email.value,
                            pai_nome: form.pai_nome.value,
                            pai_profissao: form.pai_profissao.value,
                            pai_local_emprego: form.pai_local_emprego.value,
                            pai_morada: form.pai_morada.value,
                            pai_codigo_postal: form.pai_codigo_postal.value,
                            pai_localidade: form.pai_localidade.value,
                            pai_telemovel: form.pai_telemovel.value,
                            pai_email: form.pai_email.value,
                            irmaos_frequentam:
                              form.irmaos_frequentam.value === "sim",
                            necessita_apoio:
                              form.necessita_apoio.value === "sim",
                            apoio_especificacao: form.apoio_especificacao.value,
                            origem_submissao: "site-secao-personalizada",
                            secao_personalizada_id: secao.id,
                            formulario_escolhido:
                              selectedFormLabel || selectedFormType,
                          };

                          if (!data.nome_completo || !data.morada || !data.codigo_postal || !data.localidade) {
                            alert("Preencha os campos obrigatórios.");
                            return;
                          }

                          if (crianca_nasceu && !data.data_nascimento) {
                            alert("Indique a data de nascimento.");
                            return;
                          }
                          if (!crianca_nasceu && !data.data_prevista) {
                            alert("Indique a data prevista.");
                            return;
                          }

                          try {
                            const resp = await api.post("/forms/creche", data);
                            if (resp.data?.success) {
                              alert("Inscrição Creche enviada. Entraremos em contacto.");
                              form.reset();
                            } else {
                              alert("Erro ao enviar inscrição.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao enviar inscrição.");
                          }
                        }}
                      >
                        <div className="form-field">
                          <label>Escolha a creche</label>
                          <div className="form-selector-options" style={{ marginTop: 4 }}>
                            {crecheOptionsWithAmbas.map((opt, idx) => (
                              <label
                                key={opt.id || opt.label}
                                className={`form-option-card ${
                                  selectedCreche === opt.id ? "selected" : ""
                                }`}
                                style={{ marginBottom: 0 }}
                              >
                                <input
                                  type="radio"
                                  name="creche_item_id"
                                  value={opt.id}
                                  data-label={opt.label}
                                  checked={selectedCreche === opt.id}
                                  required
                                  onChange={() =>
                                    setCrecheSelecao((prev) => ({
                                      ...prev,
                                      [secao.id]: opt.id,
                                    }))
                                  }
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="form-field">
                          <label>Nome completo da criança *</label>
                          <div className="input-with-icon">
                            <span className="input-icon">👶</span>
                            <input
                              name="nome_completo"
                              required
                              placeholder="Nome completo"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label>Morada *</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏠</span>
                              <input
                                name="morada"
                                required
                                placeholder="Rua, nº, andar"
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Código Postal *</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏷️</span>
                              <input
                                name="codigo_postal"
                                required
                                placeholder="0000-000"
                                pattern={POSTAL_PATTERN}
                                title={POSTAL_TITLE}
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Localidade *</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏘️</span>
                              <input
                                name="localidade"
                                required
                                placeholder="Localidade"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label>A criança já nasceu? *</label>
                            <div className="radio-group">
                              <label>
                                <input
                                  type="radio"
                                  name="crianca_nasceu"
                                  value="sim"
                                  onChange={() => {
                                    setCrecheNasceuState((prev) => ({ ...prev, [secao.id]: true }));
                                  }}
                                  required
                                />
                                Sim
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name="crianca_nasceu"
                                  value="nao"
                                  onChange={() => {
                                    setCrecheNasceuState((prev) => ({ ...prev, [secao.id]: false }));
                                  }}
                                  required
                                />
                                Não
                              </label>
                            </div>
                          </div>
                        </div>

                        {crecheNasceuState[secao.id] === true && (
                          <div className="form-field">
                            <label>Data de nascimento *</label>
                            <div className="input-with-icon">
                              <span className="input-icon">📅</span>
                              <input
                                type="date"
                                name="data_nascimento"
                                min={DATE_MIN}
                                max={DATE_MAX}
                                required
                              />
                            </div>
                          </div>
                        )}

                        {crecheNasceuState[secao.id] === false && (
                          <div className="form-field">
                            <label>Data prevista *</label>
                            <div className="input-with-icon">
                              <span className="input-icon">📅</span>
                              <input
                                type="date"
                                name="data_prevista"
                                min={DATE_MIN}
                                max={DATE_FUTURE_MAX}
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="form-row">
                          <div className="form-field">
                            <label>CC/BI</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🪪</span>
                              <input name="cc_bi_numero" placeholder="Número CC/BI" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>NIF</label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input name="nif" placeholder="NIF" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>NISS</label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input name="niss" placeholder="NISS" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Nº Utente</label>
                            <div className="input-with-icon">
                              <span className="input-icon">💳</span>
                              <input name="numero_utente" placeholder="Número de utente" />
                            </div>
                          </div>
                        </div>

                        <h4>Filiação</h4>
                        <div className="form-row">
                          <div className="form-field">
                            <label>Nome da Mãe</label>
                            <div className="input-with-icon">
                              <span className="input-icon">👩</span>
                              <input name="mae_nome" placeholder="Nome da mãe" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Profissão</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🧑‍💼</span>
                              <input name="mae_profissao" placeholder="Profissão" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Local de emprego</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏢</span>
                              <input name="mae_local_emprego" placeholder="Local de emprego" />
                            </div>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-field">
                            <label>Morada</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏠</span>
                              <input name="mae_morada" placeholder="Morada" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Código Postal</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏷️</span>
                              <input
                                name="mae_codigo_postal"
                                placeholder="0000-000"
                                pattern={POSTAL_PATTERN}
                                title={POSTAL_TITLE}
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Localidade</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏘️</span>
                              <input name="mae_localidade" placeholder="Localidade" />
                            </div>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-field">
                            <label>Telemóvel</label>
                            <div className="input-with-icon">
                              <span className="input-icon">📱</span>
                              <input name="mae_telemovel" placeholder="Telemóvel" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Email</label>
                            <div className="input-with-icon">
                              <span className="input-icon">✉️</span>
                              <input
                                name="mae_email"
                                type="email"
                                placeholder="email@exemplo.pt"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label>Nome do Pai</label>
                            <div className="input-with-icon">
                              <span className="input-icon">👨</span>
                              <input name="pai_nome" placeholder="Nome do pai" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Profissão do pai</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🧑‍💼</span>
                              <input name="pai_profissao" placeholder="Profissão" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Local de emprego do pai</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏢</span>
                              <input name="pai_local_emprego" placeholder="Local de emprego" />
                            </div>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-field">
                            <label>Morada do pai</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏠</span>
                              <input name="pai_morada" placeholder="Morada" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Código Postal</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏷️</span>
                              <input
                                name="pai_codigo_postal"
                                placeholder="0000-000"
                                pattern={POSTAL_PATTERN}
                                title={POSTAL_TITLE}
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Localidade</label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏘️</span>
                              <input name="pai_localidade" placeholder="Localidade" />
                            </div>
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-field">
                            <label>Telemóvel</label>
                            <div className="input-with-icon">
                              <span className="input-icon">📱</span>
                              <input name="pai_telemovel" placeholder="Telemóvel" />
                            </div>
                          </div>
                          <div className="form-field">
                            <label>Email</label>
                            <div className="input-with-icon">
                              <span className="input-icon">✉️</span>
                              <input
                                name="pai_email"
                                type="email"
                                placeholder="email@exemplo.pt"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label>Irmãos a frequentar o estabelecimento?</label>
                            <div className="radio-group">
                              <label>
                                <input type="radio" name="irmaos_frequentam" value="sim" /> Sim
                              </label>
                              <label>
                                <input type="radio" name="irmaos_frequentam" value="nao" defaultChecked /> Não
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label>A criança necessita de apoio especial?</label>
                            <div className="radio-group">
                              <label>
                                <input
                                  type="radio"
                                  name="necessita_apoio"
                                  value="sim"
                                  onChange={() => {
                                    const wrap = document.getElementById(`apoio-wrap-${secao.id}`);
                                    if (wrap) wrap.style.display = "block";
                                  }}
                                />
                                Sim
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name="necessita_apoio"
                                  value="nao"
                                  defaultChecked
                                  onChange={() => {
                                    const wrap = document.getElementById(`apoio-wrap-${secao.id}`);
                                    if (wrap) wrap.style.display = "none";
                                  }}
                                />
                                Não
                              </label>
                            </div>
                          </div>
                        </div>

                        <div
                          id={`apoio-wrap-${secao.id}`}
                          style={{ display: "none" }}
                          className="form-field"
                        >
                          <label>Se sim, especifique</label>
                          <textarea name="apoio_especificacao" rows="3" placeholder="Descreva o apoio necessário" />
                        </div>

                        <div
                          className="form-actions"
                          style={{ marginTop: 10 }}
                        >
                          <button type="submit" className="btn-save">
                            Enviar inscrição Creche
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {selectedFormType === "centro_de_dia" && (
                    <>
                      <h3>{selectedFormLabel || "Formulário Centro de Dia"}</h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const data = {
                            nome_completo: form.nome_completo.value,
                            data_nascimento: form.data_nascimento.value,
                            morada_completa: form.morada_completa.value,
                            codigo_postal: form.codigo_postal.value,
                            concelho: form.concelho.value,
                            distrito: form.distrito.value,
                            cc_bi_numero: form.cc_bi_numero.value,
                            nif: form.nif.value,
                            niss: form.niss.value,
                            numero_utente: form.numero_utente.value,
                            contacto_nome_completo: form.contacto_nome_completo.value,
                            contacto_telefone: form.contacto_telefone.value,
                            contacto_email: form.contacto_email.value,
                            contacto_parentesco: form.contacto_parentesco.value,
                            observacoes: form.observacoes.value,
                            origem_submissao: "site-secao-personalizada",
                            secao_personalizada_id: secao.id,
                            formulario_escolhido:
                              selectedFormLabel || selectedFormType,
                          };

                          if (
                            !data.nome_completo ||
                            !data.data_nascimento ||
                            !data.morada_completa ||
                            !data.codigo_postal ||
                            !data.concelho ||
                            !data.distrito ||
                            !data.cc_bi_numero ||
                            !data.nif ||
                            !data.niss ||
                            !data.numero_utente ||
                            !data.contacto_nome_completo ||
                            !data.contacto_telefone ||
                            !data.contacto_email ||
                            !data.contacto_parentesco
                          ) {
                            alert("Preencha todos os campos obrigatórios.");
                            return;
                          }

                              setCrecheSelecao((prev) => ({
                                ...prev,
                                [secao.id]: crecheOptionsWithAmbas[0]?.id || "ambas",
                              }));
                              setCrecheNasceuState((prev) => ({
                                ...prev,
                                [secao.id]: undefined,
                              }));
                          try {
                            const resp = await api.post(
                              "/forms/centro-de-dia",
                              data
                            );
                            if (resp.data?.success) {
                              alert(
                                "Inscrição Centro de Dia enviada. Entraremos em contacto."
                              );
                              form.reset();
                            } else {
                              alert("Erro ao enviar inscrição.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao enviar inscrição.");
                          }
                        }}
                      >
                        <div className="form-row">
                          <div className="form-field name-field">
                            <label htmlFor={`nome_completo-${secao.id}`}>
                              Nome completo
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">👤</span>
                              <input
                                id={`nome_completo-${secao.id}`}
                                name="nome_completo"
                                placeholder="Nome completo"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`data_nascimento-${secao.id}`}>
                              Data de nascimento
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">📅</span>
                              <input
                                id={`data_nascimento-${secao.id}`}
                                name="data_nascimento"
                                type="date"
                                min={DATE_MIN}
                                max={DATE_MAX}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`morada_completa-${secao.id}`}>
                              Morada completa
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏠</span>
                              <input
                                id={`morada_completa-${secao.id}`}
                                name="morada_completa"
                                placeholder="Rua, nº, andar"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`codigo_postal-${secao.id}`}>
                              Código Postal
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏷️</span>
                              <input
                                id={`codigo_postal-${secao.id}`}
                                name="codigo_postal"
                                placeholder="0000-000"
                                pattern={POSTAL_PATTERN}
                                title={POSTAL_TITLE}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`concelho-${secao.id}`}>
                              Concelho
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏘️</span>
                              <input
                                id={`concelho-${secao.id}`}
                                name="concelho"
                                placeholder="Concelho"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`distrito-${secao.id}`}>
                              Distrito
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🗺️</span>
                              <input
                                id={`distrito-${secao.id}`}
                                name="distrito"
                                placeholder="Distrito"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`cc_bi_numero-${secao.id}`}>
                              CC/BI Nº
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🪪</span>
                              <input
                                id={`cc_bi_numero-${secao.id}`}
                                name="cc_bi_numero"
                                placeholder="Número do CC/BI"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`nif-${secao.id}`}>
                              NIF
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input
                                id={`nif-${secao.id}`}
                                name="nif"
                                placeholder="NIF"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`niss-${secao.id}`}>
                              NISS
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input
                                id={`niss-${secao.id}`}
                                name="niss"
                                placeholder="NISS"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`numero_utente-${secao.id}`}>
                              Nº Utente de Saúde
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">💳</span>
                              <input
                                id={`numero_utente-${secao.id}`}
                                name="numero_utente"
                                placeholder="Número de utente"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`contacto_nome_completo-${secao.id}`}>
                              Nome do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">👥</span>
                              <input
                                id={`contacto_nome_completo-${secao.id}`}
                                name="contacto_nome_completo"
                                placeholder="Quem podemos contactar?"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`contacto_telefone-${secao.id}`}>
                              Telefone do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">☎️</span>
                              <input
                                id={`contacto_telefone-${secao.id}`}
                                name="contacto_telefone"
                                placeholder="Telefone"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`contacto_email-${secao.id}`}>
                              Email do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">✉️</span>
                              <input
                                id={`contacto_email-${secao.id}`}
                                name="contacto_email"
                                type="email"
                                placeholder="email@exemplo.pt"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`contacto_parentesco-${secao.id}`}>
                              Grau de parentesco
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🤝</span>
                              <input
                                id={`contacto_parentesco-${secao.id}`}
                                name="contacto_parentesco"
                                placeholder="Filho, filha, irmão, etc."
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-field">
                          <label htmlFor={`observacoes-${secao.id}`}>
                            Observações / necessidades específicas
                          </label>
                          <textarea
                            id={`observacoes-${secao.id}`}
                            name="observacoes"
                            rows="4"
                            placeholder="Medicações, alergias, mobilidade, etc."
                          />
                        </div>

                        <div
                          className="form-actions"
                          style={{ marginTop: 10 }}
                        >
                          <button type="submit" className="btn-save">
                            Enviar inscrição Centro de Dia
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {selectedFormType === "sad" && (
                    <>
                      <h3>{selectedFormLabel || "Formulário SAD"}</h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;

                          const data = {
                            nome_completo: form.nome_completo.value,
                            data_nascimento: form.data_nascimento.value,
                            morada_completa: form.morada_completa.value,
                            codigo_postal: form.codigo_postal.value,
                            concelho: form.concelho.value,
                            distrito: form.distrito.value,
                            cc_bi_numero: form.cc_bi_numero.value,
                            nif: form.nif.value,
                            niss: form.niss.value,
                            numero_utente: form.numero_utente.value,
                            contacto_nome_completo: form.contacto_nome_completo.value,
                            contacto_telefone: form.contacto_telefone.value,
                            contacto_email: form.contacto_email.value,
                            contacto_parentesco: form.contacto_parentesco.value,
                            observacoes: form.observacoes.value,
                            higiene_pessoal: form.higiene_pessoal.checked,
                            higiene_habitacional: form.higiene_habitacional.checked,
                            refeicoes: form.refeicoes.checked,
                            tratamento_roupa: form.tratamento_roupa.checked,
                            periodicidade_higiene_pessoal:
                              form.higiene_pessoal.checked
                                ? form.periodicidade_higiene_pessoal.value
                                : "",
                            vezes_higiene_pessoal:
                              form.higiene_pessoal.checked
                                ? form.vezes_higiene_pessoal.value
                                : "",
                            periodicidade_higiene_habitacional:
                              form.higiene_habitacional.checked
                                ? form.periodicidade_higiene_habitacional.value
                                : "",
                            vezes_higiene_habitacional:
                              form.higiene_habitacional.checked
                                ? form.vezes_higiene_habitacional.value
                                : "",
                            periodicidade_refeicoes:
                              form.refeicoes.checked
                                ? form.periodicidade_refeicoes.value
                                : "",
                            vezes_refeicoes:
                              form.refeicoes.checked
                                ? form.vezes_refeicoes.value
                                : "",
                            periodicidade_tratamento_roupa:
                              form.tratamento_roupa.checked
                                ? form.periodicidade_tratamento_roupa.value
                                : "",
                            vezes_tratamento_roupa:
                              form.tratamento_roupa.checked
                                ? form.vezes_tratamento_roupa.value
                                : "",
                            origem_submissao: "site-secao-personalizada",
                            secao_personalizada_id: secao.id,
                            formulario_escolhido:
                              selectedFormLabel || selectedFormType,
                          };

                          if (
                            !data.nome_completo ||
                            !data.data_nascimento ||
                            !data.morada_completa ||
                            !data.codigo_postal ||
                            !data.concelho ||
                            !data.distrito ||
                            !data.cc_bi_numero ||
                            !data.nif ||
                            !data.niss ||
                            !data.numero_utente ||
                            !data.contacto_nome_completo ||
                            !data.contacto_telefone ||
                            !data.contacto_email ||
                            !data.contacto_parentesco
                          ) {
                            alert("Preencha todos os campos obrigatórios.");
                            return;
                          }

                          try {
                            const resp = await api.post("/forms/sad", data);
                            if (resp.data?.success) {
                              alert(
                                "Inscrição SAD enviada. Entraremos em contacto."
                              );
                              form.reset();
                            } else {
                              alert("Erro ao enviar inscrição.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao enviar inscrição.");
                          }
                        }}
                      >
                        <div className="form-row">
                          <div className="form-field name-field">
                            <label htmlFor={`nome_completo-${secao.id}`}>
                              Nome completo
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">👤</span>
                              <input
                                id={`nome_completo-${secao.id}`}
                                name="nome_completo"
                                placeholder="Nome completo"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`data_nascimento-${secao.id}`}>
                              Data de nascimento
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">📅</span>
                              <input
                                id={`data_nascimento-${secao.id}`}
                                name="data_nascimento"
                                type="date"
                                min={DATE_MIN}
                                max={DATE_MAX}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`morada_completa-${secao.id}`}>
                              Morada completa
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏠</span>
                              <input
                                id={`morada_completa-${secao.id}`}
                                name="morada_completa"
                                placeholder="Rua, nº, andar"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`codigo_postal-${secao.id}`}>
                              Código Postal
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏷️</span>
                              <input
                                id={`codigo_postal-${secao.id}`}
                                name="codigo_postal"
                                placeholder="0000-000"
                                pattern={POSTAL_PATTERN}
                                title={POSTAL_TITLE}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`concelho-${secao.id}`}>
                              Concelho
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🏘️</span>
                              <input
                                id={`concelho-${secao.id}`}
                                name="concelho"
                                placeholder="Concelho"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`distrito-${secao.id}`}>
                              Distrito
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🗺️</span>
                              <input
                                id={`distrito-${secao.id}`}
                                name="distrito"
                                placeholder="Distrito"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`cc_bi_numero-${secao.id}`}>
                              CC/BI Nº
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🪪</span>
                              <input
                                id={`cc_bi_numero-${secao.id}`}
                                name="cc_bi_numero"
                                placeholder="Número do CC/BI"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`nif-${secao.id}`}>
                              NIF
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input
                                id={`nif-${secao.id}`}
                                name="nif"
                                placeholder="NIF"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`niss-${secao.id}`}>
                              NISS
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">#</span>
                              <input
                                id={`niss-${secao.id}`}
                                name="niss"
                                placeholder="NISS"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`numero_utente-${secao.id}`}>
                              Nº Utente de Saúde
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">💳</span>
                              <input
                                id={`numero_utente-${secao.id}`}
                                name="numero_utente"
                                placeholder="Número de utente"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`contacto_nome_completo-${secao.id}`}>
                              Nome do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">👥</span>
                              <input
                                id={`contacto_nome_completo-${secao.id}`}
                                name="contacto_nome_completo"
                                placeholder="Quem podemos contactar?"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`contacto_telefone-${secao.id}`}>
                              Telefone do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">☎️</span>
                              <input
                                id={`contacto_telefone-${secao.id}`}
                                name="contacto_telefone"
                                placeholder="Telefone"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field">
                            <label htmlFor={`contacto_email-${secao.id}`}>
                              Email do contacto
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">✉️</span>
                              <input
                                id={`contacto_email-${secao.id}`}
                                name="contacto_email"
                                type="email"
                                placeholder="email@exemplo.pt"
                                required
                              />
                            </div>
                          </div>
                          <div className="form-field">
                            <label htmlFor={`contacto_parentesco-${secao.id}`}>
                              Grau de parentesco
                            </label>
                            <div className="input-with-icon">
                              <span className="input-icon">🤝</span>
                              <input
                                id={`contacto_parentesco-${secao.id}`}
                                name="contacto_parentesco"
                                placeholder="Filho, filha, irmão, etc."
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-field">
                          <label htmlFor={`observacoes-${secao.id}`}>
                            Observações / necessidades específicas
                          </label>
                          <textarea
                            id={`observacoes-${secao.id}`}
                            name="observacoes"
                            rows="4"
                            placeholder="Medicações, alergias, mobilidade, etc."
                          />
                        </div>

                        {/* Serviços marcáveis */}
                        <div className="form-row">
                          <div className="form-field checkbox-field">
                            <label>
                              <input
                                type="checkbox"
                                name="higiene_pessoal"
                                id={`higiene_pessoal-${secao.id}`}
                                onChange={(e) => {
                                  const wrap = document.getElementById(
                                    `wrap-higiene_pessoal-${secao.id}`
                                  );
                                  if (wrap) wrap.style.display = e.target.checked ? "block" : "none";
                                }}
                              />
                              Higiene pessoal
                            </label>
                          </div>
                          <div className="form-field checkbox-field">
                            <label>
                              <input
                                type="checkbox"
                                name="higiene_habitacional"
                                id={`higiene_habitacional-${secao.id}`}
                                onChange={(e) => {
                                  const wrap = document.getElementById(
                                    `wrap-higiene_habitacional-${secao.id}`
                                  );
                                  if (wrap) wrap.style.display = e.target.checked ? "block" : "none";
                                }}
                              />
                              Higiene habitacional
                            </label>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-field checkbox-field">
                            <label>
                              <input
                                type="checkbox"
                                name="refeicoes"
                                id={`refeicoes-${secao.id}`}
                                onChange={(e) => {
                                  const wrap = document.getElementById(
                                    `wrap-refeicoes-${secao.id}`
                                  );
                                  if (wrap) wrap.style.display = e.target.checked ? "block" : "none";
                                }}
                              />
                              Refeições
                            </label>
                          </div>
                          <div className="form-field checkbox-field">
                            <label>
                              <input
                                type="checkbox"
                                name="tratamento_roupa"
                                id={`tratamento_roupa-${secao.id}`}
                                onChange={(e) => {
                                  const wrap = document.getElementById(
                                    `wrap-tratamento_roupa-${secao.id}`
                                  );
                                  if (wrap) wrap.style.display = e.target.checked ? "block" : "none";
                                }}
                              />
                              Tratamento de roupa
                            </label>
                          </div>
                        </div>

                        {/* Configurações por serviço */}
                        <div
                          id={`wrap-higiene_pessoal-${secao.id}`}
                          style={{ display: "none" }}
                          className="service-config"
                        >
                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`periodicidade_higiene_pessoal-${secao.id}`}>
                                Periodicidade (Higiene pessoal)
                              </label>
                              <select
                                id={`periodicidade_higiene_pessoal-${secao.id}`}
                                name="periodicidade_higiene_pessoal"
                                defaultValue=""
                              >
                                <option value="">Selecione</option>
                                <option value="segunda a sexta">Segunda a sexta</option>
                                <option value="segunda a sabado">Segunda a sábado</option>
                                <option value="segunda a domingo">Segunda a domingo</option>
                              </select>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`vezes_higiene_pessoal-${secao.id}`}>
                                Vezes por dia (Higiene pessoal)
                              </label>
                              <input
                                id={`vezes_higiene_pessoal-${secao.id}`}
                                name="vezes_higiene_pessoal"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="1-5"
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          id={`wrap-higiene_habitacional-${secao.id}`}
                          style={{ display: "none" }}
                          className="service-config"
                        >
                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`periodicidade_higiene_habitacional-${secao.id}`}>
                                Periodicidade (Higiene habitacional)
                              </label>
                              <select
                                id={`periodicidade_higiene_habitacional-${secao.id}`}
                                name="periodicidade_higiene_habitacional"
                                defaultValue=""
                              >
                                <option value="">Selecione</option>
                                <option value="segunda a sexta">Segunda a sexta</option>
                                <option value="segunda a sabado">Segunda a sábado</option>
                                <option value="segunda a domingo">Segunda a domingo</option>
                              </select>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`vezes_higiene_habitacional-${secao.id}`}>
                                Vezes por dia (Higiene habitacional)
                              </label>
                              <input
                                id={`vezes_higiene_habitacional-${secao.id}`}
                                name="vezes_higiene_habitacional"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="1-5"
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          id={`wrap-refeicoes-${secao.id}`}
                          style={{ display: "none" }}
                          className="service-config"
                        >
                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`periodicidade_refeicoes-${secao.id}`}>
                                Periodicidade (Refeições)
                              </label>
                              <select
                                id={`periodicidade_refeicoes-${secao.id}`}
                                name="periodicidade_refeicoes"
                                defaultValue=""
                              >
                                <option value="">Selecione</option>
                                <option value="segunda a sexta">Segunda a sexta</option>
                                <option value="segunda a sabado">Segunda a sábado</option>
                                <option value="segunda a domingo">Segunda a domingo</option>
                              </select>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`vezes_refeicoes-${secao.id}`}>
                                Vezes por dia (Refeições)
                              </label>
                              <input
                                id={`vezes_refeicoes-${secao.id}`}
                                name="vezes_refeicoes"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="1-5"
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          id={`wrap-tratamento_roupa-${secao.id}`}
                          style={{ display: "none" }}
                          className="service-config"
                        >
                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`periodicidade_tratamento_roupa-${secao.id}`}>
                                Periodicidade (Tratamento de roupa)
                              </label>
                              <select
                                id={`periodicidade_tratamento_roupa-${secao.id}`}
                                name="periodicidade_tratamento_roupa"
                                defaultValue=""
                              >
                                <option value="">Selecione</option>
                                <option value="segunda a sexta">Segunda a sexta</option>
                                <option value="segunda a sabado">Segunda a sábado</option>
                                <option value="segunda a domingo">Segunda a domingo</option>
                              </select>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`vezes_tratamento_roupa-${secao.id}`}>
                                Vezes por dia (Tratamento de roupa)
                              </label>
                              <input
                                id={`vezes_tratamento_roupa-${secao.id}`}
                                name="vezes_tratamento_roupa"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="1-5"
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          className="form-actions"
                          style={{ marginTop: 10 }}
                        >
                          <button type="submit" className="btn-save">
                            Enviar inscrição SAD
                          </button>
                        </div>
                      </form>
                    </>
                  )}
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
                    <input id="nome" name="nome" placeholder="Nome" required />
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
        </div>
      </section>

      {showTranspModal && (
        <div
          className="edit-modal-overlay"
          onClick={() => setShowTranspModal(false)}
        >
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Adicionar documento de transparência</h3>
              <button
                className="btn-close"
                onClick={() => setShowTranspModal(false)}
              >
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
                    <option value="Relatorio_Atividades">
                      Relatório de Atividades
                    </option>
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

              {transpError && (
                <div className="alert alert-error">{transpError}</div>
              )}

              <div className="form-actions" style={{ gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTranspModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={transpSubmitting}
                >
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
        <div className="edit-modal-overlay" onClick={closeEditModal}>
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
              <button className="btn-close" onClick={closeEditModal}>
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

              {editingSection === "secao-personalizada" && (
                <>
                  <div className="cover-image-upload">
                    <label>
                      <strong>Imagem:</strong>
                      <div className="cover-preview-row">
                        {editingData.imagem ? (
                          <img
                            src={editingData.imagem}
                            alt="Preview"
                            className="cover-preview"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_SVG;
                            }}
                          />
                        ) : (
                          <div className="cover-placeholder">
                            Nenhuma imagem
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
                          <small className="hint">Enviar imagem</small>
                          {editingData.imagem && (
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={() =>
                                setEditingData({ ...editingData, imagem: "" })
                              }
                              title="Remover imagem"
                            >
                              🗑️ Remover
                            </button>
                          )}
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
                      placeholder="Título do item"
                    />
                  </label>

                  <label>
                    <strong>Subtítulo:</strong>
                    <input
                      type="text"
                      value={editingData.subtitulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          subtitulo: e.target.value,
                        })
                      }
                      placeholder="Subtítulo ou resumo breve"
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

                  <label>
                    <strong>URL de Vídeo (opcional):</strong>
                    <input
                      type="url"
                      value={editingData.video_url || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          video_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </label>

                  <label>
                    <strong>Link Externo (opcional):</strong>
                    <input
                      type="url"
                      value={editingData.link_externo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          link_externo: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                    <small className="hint">
                      Se preenchido, o item será um link clicável
                    </small>
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
              <button className="btn-cancel" onClick={closeEditModal}>
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
        <div className="edit-modal-overlay" onClick={closeNewsModal}>
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
            ref={newsModalRef}
          >
            <div className="edit-modal-header">
              <h3>{selectedNews.titulo}</h3>
              <button className="btn-close" onClick={closeNewsModal}>
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

      {/* Modal de Item Personalizado */}
      {showCustomItemModal && selectedCustomItem && (
        <div
          className="edit-modal-overlay"
          onClick={() => {
            setShowCustomItemModal(false);
            if (lastFocusedRef.current) {
              lastFocusedRef.current.focus();
            }
          }}
        >
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>{selectedCustomItem.titulo || "Detalhes"}</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowCustomItemModal(false);
                  if (lastFocusedRef.current) {
                    lastFocusedRef.current.focus();
                  }
                }}
              >
                ✕
              </button>
            </div>
            <div className="edit-modal-body">
              {selectedCustomItem.imagem && (
                <img
                  src={selectedCustomItem.imagem}
                  alt={selectedCustomItem.titulo}
                  className="content-image"
                  style={{
                    width: "100%",
                    marginBottom: "1rem",
                    borderRadius: "8px",
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_SVG;
                  }}
                />
              )}

              {selectedCustomItem.titulo && (
                <h3 style={{ marginTop: 12 }}>{selectedCustomItem.titulo}</h3>
              )}

              {selectedCustomItem.subtitulo && (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#666",
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                >
                  {selectedCustomItem.subtitulo}
                </p>
              )}

              {selectedCustomItem.conteudo && (
                <div
                  className="custom-item-content"
                  dangerouslySetInnerHTML={{
                    __html: selectedCustomItem.conteudo || "",
                  }}
                />
              )}

              {selectedCustomItem.video_url && (
                <video
                  controls
                  style={{
                    width: "100%",
                    marginTop: "1rem",
                    borderRadius: "8px",
                  }}
                >
                  <source src={selectedCustomItem.video_url} type="video/mp4" />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              )}

              {selectedCustomItem.link_externo && (
                <div style={{ marginTop: "1rem" }}>
                  <a
                    href={selectedCustomItem.link_externo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: "inline-block",
                      padding: "0.75rem 1.5rem",
                    }}
                  >
                    🔗 Visitar Link Externo
                  </a>
                </div>
              )}
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
        <div className="edit-modal-overlay" onClick={closeAddModal}>
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
              <button className="btn-close" onClick={closeAddModal}>
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
