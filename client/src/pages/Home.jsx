import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Home.css";

// Local SVG placeholder (data URI) to avoid external requests to via.placeholder.com
const PLACEHOLDER_SVG =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><rect fill='#f6f7fb' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#888' font-size='28' font-family='Arial, sans-serif'>Imagem</text></svg>`,
  );

const PDF_PLACEHOLDER =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='350'><rect fill='#0b1930' width='100%' height='100%'/><rect x='40' y='30' rx='18' ry='18' width='520' height='290' fill='#132844' stroke='#4da3ff' stroke-width='6'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#4da3ff' font-size='64' font-family='Arial, sans-serif' font-weight='700'>PDF</text></svg>`,
  );

const DEFAULT_HERO = {
  titulo: "Centro Paroquial e Social de Lanheses",
  subtitulo: "Dedicando-nos ao apoio social à Pessoas Mais Velhas e à Infância",
  imagem_fundo: "",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT");
  } catch (e) {
    return dateStr;
  }
};

const MAX_RESPOSTA_DESTAQUES = 3;

const parseRespostaDestaques = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
};

const normalizeRespostaDestaques = (value) =>
  parseRespostaDestaques(value).map((item) => ({
    titulo: item?.titulo ? String(item.titulo) : "",
    texto: item?.texto ? String(item.texto) : "",
  }));

const buildRespostaDestaques = (value) =>
  normalizeRespostaDestaques(value)
    .map((item) => ({
      titulo: item.titulo.trim(),
      texto: item.texto.trim(),
    }))
    .filter((item) => item.titulo || item.texto)
    .slice(0, MAX_RESPOSTA_DESTAQUES);

const serializeRespostaDestaques = (value) => {
  const cleaned = buildRespostaDestaques(value);
  return cleaned.length ? JSON.stringify(cleaned) : null;
};

// Editor simples baseado em contentEditable (compatível com React 19+)
function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [defaultFontLabel, setDefaultFontLabel] = useState("Tipo de letra");
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

  const saveSelection = () => {
    try {
      const sel = document.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    } catch (e) {
      // ignore
    }
  };

  const restoreSelection = () => {
    try {
      const sel = document.getSelection();
      if (sel && savedRangeRef.current) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    } catch (e) {
      // ignore
    }
  };

  const syncFormats = () => {
    try {
      const sel = document.getSelection();
      let bold = false;
      let italic = false;
      let underline = false;
      let list = false;
      if (sel && sel.rangeCount > 0) {
        try {
          bold = document.queryCommandState("bold");
          italic = document.queryCommandState("italic");
          underline = document.queryCommandState("underline");
          list = document.queryCommandState("insertUnorderedList");
        } catch (e) {
          const node = sel.anchorNode;
          const el = node && node.nodeType === 3 ? node.parentElement : node;
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
  };

  const exec = (command, value = null) => {
    // execCommand ainda funciona na maioria dos browsers para operações simples
    restoreSelection();
    document.execCommand(command, false, value);
    // atualizar estado
    onChange(editorRef.current.innerHTML);
    // recolocar foco no editor para que a escrita continue e o caret seja preservado
    try {
      editorRef.current && editorRef.current.focus();
    } catch (e) {
      // ignore
    }
    syncFormats();
  };

  // Formats are updated only when the toolbar buttons are clicked (see exec()).

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

  useEffect(() => {
    if (!editorRef.current || typeof window === "undefined") return;
    try {
      const fontFamily = window.getComputedStyle(editorRef.current).fontFamily;
      const first =
        fontFamily?.split(",")[0]?.replace(/['"]/g, "").trim() || "";
      if (first) setDefaultFontLabel(first);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="richtext-editor">
      <div className="rt-toolbar">
        <select
          onChange={(e) => {
            if (e.target.value === "__default") return;
            exec("fontName", e.target.value);
          }}
          defaultValue="__default"
          aria-label="Tipo de letra"
        >
          <option value="__default">{defaultFontLabel}</option>
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue=""
          aria-label="Tamanho da fonte"
        >
          <option value="">Tamanho</option>
          <option value="2">Pequeno</option>
          <option value="3">Normal</option>
          <option value="4">Grande</option>
        </select>
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
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="rt-editor-area"
        onInput={(e) => {
          onChange(e.currentTarget.innerHTML);
          saveSelection();
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        onFocus={() => {
          saveSelection();
          syncFormats();
        }}
        onMouseUp={() => {
          saveSelection();
          syncFormats();
        }}
        onKeyUp={() => {
          saveSelection();
          syncFormats();
        }}
        style={{ minHeight: 150, border: "1px solid #ddd", padding: 8 }}
      />
    </div>
  );
}

// utilitário simples para remover tags HTML (usado para resumo)
function stripHtml(html = "") {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
const IMAGE_MAX_MB = 3;

const normalizeDigits = (value = "") => value.replace(/\D/g, "");

const isValidPostal = (value = "") =>
  new RegExp(`^${POSTAL_PATTERN}$`).test(value.trim());

const isValidPhone = (value = "") => normalizeDigits(value).length === 9;

const isValidUtente = (value = "") => normalizeDigits(value).length === 9;

const isValidNif = (value = "") => {
  const digits = normalizeDigits(value);
  if (digits.length !== 9) return false;
  const nums = digits.split("").map((n) => Number(n));
  let sum = 0;
  for (let i = 0; i < 8; i += 1) {
    sum += nums[i] * (9 - i);
  }
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === nums[8];
};

const isValidNiss = (value = "") => normalizeDigits(value).length === 11;

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


const normalizeFormOptions = (opcoes = []) => {
  return opcoes.filter(Boolean).map((opt, idx) => {
    const tipo = opt?.tipo || opt?.id || opt?.value || opt;
    return {
      tipo,
      label: opt?.label || FORM_TYPE_LABELS[tipo] || `Formulário ${idx + 1}`,
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
      titulo: cfg.titulo || "",
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
  const [existingMedia, setExistingMedia] = useState([]);
  const [pendingMediaFiles, setPendingMediaFiles] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [imageWarnings, setImageWarnings] = useState({});
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    resolve: null,
  });
  const [secoesPersonalizadas, setSecoesPersonalizadas] = useState([]);
  const [itensSecoesPersonalizadas, setItensSecoesPersonalizadas] = useState(
    {},
  );
  const [loadingSecoes, setLoadingSecoes] = useState(true);
  const [editingSecaoPersonalizada, setEditingSecaoPersonalizada] =
    useState(null);
  const [selectedCustomItem, setSelectedCustomItem] = useState(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [formSelections, setFormSelections] = useState({});
  const [crecheSelecao, setCrecheSelecao] = useState({});
  const [crecheNasceuState, setCrecheNasceuState] = useState({});
  const [heroConfig, setHeroConfig] = useState(DEFAULT_HERO);

  // Estados para drag and drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedSection, setDraggedSection] = useState(null);
  const [draggedSecaoId, setDraggedSecaoId] = useState(null);

  const lastFocusedRef = useRef(null);
  const editModalRef = useRef(null);
  const addModalRef = useRef(null);
  const newsModalRef = useRef(null);
  const transpModalRef = useRef(null);
  const confirmModalRef = useRef(null);
  const customItemModalRef = useRef(null);
  const institutionalModalRef = useRef(null);
  const respostaModalRef = useRef(null);

  const normalizeHeroConfig = (data = {}) => {
    const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
    const normalizedImage = data.imagem_fundo
      ? data.imagem_fundo.startsWith("http")
        ? data.imagem_fundo
        : `${base}${data.imagem_fundo}`
      : "";

    return {
      ...DEFAULT_HERO,
      ...data,
      imagem_fundo: normalizedImage || DEFAULT_HERO.imagem_fundo,
    };
  };

  const getBaseUrl = () => api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";

  const normalizeMediaUrls = useCallback((media = []) => {
    const base = getBaseUrl();
    return media.map((m) => ({
      ...m,
      url: m.url && !m.url.startsWith("http") ? `${base}${m.url}` : m.url,
    }));
  }, []);

  const getMediaTableForSection = (section) => {
    if (section === "noticias") return "noticias_eventos";
    if (section === "respostas-sociais") return "respostas_sociais";
    if (section === "institucional" || section === "instituicao")
      return "conteudo_institucional";
    if (section === "secao-personalizada") return "itens_secoes_personalizadas";
    return null;
  };

  const resetPendingMedia = () => {
    pendingMediaFiles.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    setPendingMediaFiles([]);
  };

  const resetMediaState = () => {
    resetPendingMedia();
    setExistingMedia([]);
  };

  const addPendingMediaFiles = async (files) => {
    if (!files || !files.length) return;
    const accepted = [];
    const rejected = [];

    for (const file of Array.from(files)) {
      const validation = await validateImageFile(file);
      if (!validation.ok) {
        rejected.push(validation.message || "Imagem inválida.");
      } else {
        accepted.push(file);
      }
    }

    if (rejected.length) {
      setImageWarning(
        "gallery",
        rejected.length === 1
          ? rejected[0]
          : `Algumas imagens não foram aceites. Limite: ${IMAGE_MAX_MB} MB.`,
      );
    } else {
      clearImageWarning("gallery");
    }

    if (!accepted.length) return;
    const stamp = Date.now();
    const mapped = accepted.map((file, index) => ({
      id: `${stamp}-${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingMediaFiles((prev) => [...prev, ...mapped]);
  };

  const removePendingMedia = (id) => {
    setPendingMediaFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== id);
    });
  };

  const fetchMediaForItem = useCallback(
    async (tabelaRef, idReferencia) => {
      if (!tabelaRef || !idReferencia) return [];
      try {
        const response = await api.get("/media", {
          params: {
            tabela_referencia: tabelaRef,
            id_referencia: idReferencia,
          },
        });
        return normalizeMediaUrls(response.data?.data || []);
      } catch (error) {
        console.error("Erro ao carregar media:", error);
        return [];
      }
    },
    [normalizeMediaUrls],
  );

  const loadExistingMediaForEdit = async (section, idReferencia) => {
    const tabelaRef = getMediaTableForSection(section);
    if (!tabelaRef || !idReferencia) {
      setExistingMedia([]);
      return;
    }
    try {
      setMediaLoading(true);
      const media = await fetchMediaForItem(tabelaRef, idReferencia);
      setExistingMedia(media);
    } finally {
      setMediaLoading(false);
    }
  };

  const removeExistingMedia = async (mediaId) => {
    try {
      await api.delete(`/media/${mediaId}`);
      setExistingMedia((prev) => prev.filter((item) => item.id !== mediaId));
    } catch (error) {
      console.error("Erro ao remover media:", error);
      alert("Erro ao remover fotografia.");
    }
  };

  const uploadPendingMediaForItem = async (tabelaRef, idReferencia) => {
    if (!tabelaRef || !idReferencia || pendingMediaFiles.length === 0) return;
    try {
      const base = getBaseUrl();
      const startOrder = existingMedia.length;
      for (let i = 0; i < pendingMediaFiles.length; i += 1) {
        const item = pendingMediaFiles[i];
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("tabela_referencia", tabelaRef);
        formData.append("id_referencia", idReferencia);
        formData.append("ordem", startOrder + i);

        const response = await api.post("/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        let url = response.data?.data?.url;
        if (url && !url.startsWith("http")) url = `${base}${url}`;
        if (url) {
          setExistingMedia((prev) => [
            ...prev,
            { id: response.data?.data?.id, url, tipo: "imagem" },
          ]);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar fotografias:", error);
      alert("Erro ao enviar fotografias.");
    } finally {
      resetPendingMedia();
    }
  };

  const refreshItemMedia = async (section, idReferencia, secaoId = null) => {
    const tabelaRef = getMediaTableForSection(section);
    if (!tabelaRef || !idReferencia) return;
    const media = await fetchMediaForItem(tabelaRef, idReferencia);
    if (section === "noticias") {
      setNoticias((prev) =>
        prev.map((item) =>
          item.id === idReferencia ? { ...item, media } : item,
        ),
      );
    } else if (section === "respostas-sociais") {
      setRespostasSociais((prev) =>
        prev.map((item) =>
          item.id === idReferencia ? { ...item, media } : item,
        ),
      );
    } else if (section === "institucional" || section === "instituicao") {
      setConteudoInstitucional((prev) =>
        prev.map((item) =>
          item.id === idReferencia ? { ...item, media } : item,
        ),
      );
    } else if (section === "secao-personalizada" && secaoId) {
      setItensSecoesPersonalizadas((prev) => ({
        ...prev,
        [secaoId]: (prev[secaoId] || []).map((item) =>
          item.id === idReferencia ? { ...item, media } : item,
        ),
      }));
    }
  };

  const buildCarouselImages = (primaryUrl, media = []) => {
    const urls = [];
    media.forEach((m) => {
      const isImage =
        !m.tipo ||
        m.tipo === "imagem" ||
        (m.mime_type && m.mime_type.startsWith("image/"));
      if (isImage && m.url && m.url !== primaryUrl) urls.push(m.url);
    });
    return Array.from(new Set(urls));
  };

  const buildGalleryImages = (primaryUrl, media = []) => {
    const urls = [];
    media.forEach((m) => {
      const isImage =
        !m.tipo ||
        m.tipo === "imagem" ||
        (m.mime_type && m.mime_type.startsWith("image/"));
      if (isImage && m.url && m.url !== primaryUrl) urls.push(m.url);
    });
    return Array.from(new Set(urls));
  };

  const ImageCarousel = ({ images = [], altPrefix = "Imagem" }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
      setIndex(0);
    }, [images]);

    if (!images.length) return null;

    const goPrev = () =>
      setIndex((prev) => (prev - 1 + images.length) % images.length);
    const goNext = () => setIndex((prev) => (prev + 1) % images.length);

    return (
      <div className="image-carousel">
        <div className="carousel-main">
          <img
            src={images[index]}
            alt={`${altPrefix} ${index + 1}`}
            className="carousel-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = PLACEHOLDER_SVG;
            }}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="carousel-control prev"
                onClick={goPrev}
                aria-label="Fotografia anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-control next"
                onClick={goNext}
                aria-label="Próxima fotografia"
              >
                ›
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="carousel-thumbs">
            {images.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                className={`carousel-thumb-btn ${
                  idx === index ? "active" : ""
                }`}
                onClick={() => setIndex(idx)}
                aria-label={`Fotografia ${idx + 1}`}
              >
                <img
                  src={src}
                  alt={`${altPrefix} ${idx + 1}`}
                  className="carousel-thumb"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_SVG;
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const InlineGallery = ({ images = [], altPrefix = "Imagem" }) => {
    if (!images.length) return null;
    return (
      <div className="inline-gallery">
        {images.map((src, idx) => (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={`${altPrefix} ${idx + 1}`}
            className="inline-gallery-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = PLACEHOLDER_SVG;
            }}
          />
        ))}
      </div>
    );
  };

  const isImageMedia = (m) =>
    !m?.tipo || m.tipo === "imagem" || m.mime_type?.startsWith("image/");

  const renderMediaPicker = () => {
    const tabelaRef = getMediaTableForSection(editingSection);
    if (!tabelaRef) return null;

    const imageMedia = existingMedia.filter(isImageMedia);

    return (
      <div className="media-picker">
        <label>
          <strong>Galeria de Fotografias:</strong>
          <span className="file-button">
            Escolher ficheiros
            <input
              type="file"
              accept="image/*"
              multiple
              className="file-input-hidden"
              onChange={async (e) => {
                await addPendingMediaFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </span>
          <small className="hint">
            Pode selecionar várias imagens (máx. {IMAGE_MAX_MB} MB cada)
          </small>
          {imageWarnings.gallery && (
            <div className="file-warning">{imageWarnings.gallery}</div>
          )}
        </label>

        {mediaLoading && <small>A carregar fotografias...</small>}

        {(imageMedia.length > 0 || pendingMediaFiles.length > 0) && (
          <div className="media-preview-grid">
            {imageMedia.map((item) => (
              <div key={`existing-${item.id}`} className="media-preview-item">
                <img
                  src={item.url}
                  alt={item.nome || "Imagem"}
                  className="media-preview-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_SVG;
                  }}
                />
                {item.id && (
                  <button
                    type="button"
                    className="media-remove-btn"
                    onClick={() => removeExistingMedia(item.id)}
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {pendingMediaFiles.map((item) => (
              <div key={item.id} className="media-preview-item pending">
                <img
                  src={item.preview}
                  alt="Pré-visualização"
                  className="media-preview-image"
                />
                <button
                  type="button"
                  className="media-remove-btn"
                  onClick={() => removePendingMedia(item.id)}
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const addRespostaDestaque = () => {
    setEditingData((prev) => {
      const current = normalizeRespostaDestaques(prev?.destaques);
      if (current.length >= MAX_RESPOSTA_DESTAQUES) return prev;
      return {
        ...prev,
        destaques: [...current, { titulo: "", texto: "" }],
      };
    });
  };

  const updateRespostaDestaque = (index, field, value) => {
    setEditingData((prev) => {
      const current = normalizeRespostaDestaques(prev?.destaques);
      const next = current.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      );
      return { ...prev, destaques: next };
    });
  };

  const removeRespostaDestaque = (index) => {
    setEditingData((prev) => {
      const current = normalizeRespostaDestaques(prev?.destaques);
      const next = current.filter((_, idx) => idx !== index);
      return { ...prev, destaques: next };
    });
  };

  const renderRespostaDestaquesEditor = () => {
    // Agora funciona para respostas-sociais, noticias, conteudo institucional e secoes personalizadas
    const isAllowed =
      editingSection === "respostas-sociais" ||
      editingSection === "noticias" ||
      editingSection === "instituicao" ||
      editingSecaoPersonalizada;
    if (!isAllowed) return null;

    const destaques = normalizeRespostaDestaques(editingData?.destaques);
    const canAdd = destaques.length < MAX_RESPOSTA_DESTAQUES;

    return (
      <div className="resposta-highlights-editor">
        <div className="resposta-highlights-header">
          <strong>Subtítulos (até 3)</strong>
          <button
            type="button"
            className="btn-add-highlight"
            onClick={addRespostaDestaque}
            disabled={!canAdd}
          >
            Adicionar subtítulo
          </button>
        </div>

        {destaques.length === 0 && (
          <small className="hint">
            Adicione até 3 subtítulos com o respetivo texto.
          </small>
        )}

        {destaques.map((item, idx) => (
          <div key={`destaque-${idx}`} className="resposta-highlight-row">
            <div className="resposta-highlight-fields">
              <label>
                <strong>Subtítulo {idx + 1}:</strong>
                <input
                  type="text"
                  value={item.titulo}
                  onChange={(e) =>
                    updateRespostaDestaque(idx, "titulo", e.target.value)
                  }
                  placeholder="Ex: Atendimento Diurno"
                />
              </label>
              <label>
                <strong>Texto:</strong>
                <textarea
                  rows="2"
                  value={item.texto}
                  onChange={(e) =>
                    updateRespostaDestaque(idx, "texto", e.target.value)
                  }
                  placeholder="Texto abaixo do subtítulo"
                />
              </label>
            </div>
            <div className="resposta-highlight-actions">
              <button
                type="button"
                className="btn-remove-highlight"
                onClick={() => removeRespostaDestaque(idx)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Upload cover image (imagem_destaque) and set editingData.imagem_destaque
  const uploadCoverImage = async (file) => {
    try {
      const validation = await validateImageFile(file);
      if (!validation.ok) {
        setImageWarning(
          "cover",
          validation.message ||
            `A imagem deve ter no máximo ${IMAGE_MAX_MB} MB.`,
        );
        return;
      }
      clearImageWarning("cover");

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
      toast.error("Erro ao enviar imagem de capa.");
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

  // Carregar configuração do hero da API (fallback para localStorage)
  useEffect(() => {
    const loadHero = async () => {
      try {
        const response = await api.get("/hero");
        if (response.data?.success && response.data.data) {
          const normalized = normalizeHeroConfig(response.data.data);
          setHeroConfig(normalized);
          localStorage.setItem("heroConfig", JSON.stringify(normalized));
          return;
        }
      } catch (error) {
        console.error("Erro ao carregar hero da API:", error);
      }

      // fallback localStorage se API falhar
      const savedHeroConfig = localStorage.getItem("heroConfig");
      if (savedHeroConfig) {
        try {
          setHeroConfig(normalizeHeroConfig(JSON.parse(savedHeroConfig)));
        } catch (e) {
          console.error("Erro ao carregar configuração do hero:", e);
        }
      }
    };

    loadHero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscar projetos da API
  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const response = await api.get("/projetos");
      const base = getBaseUrl();
      // Normalizar URLs de imagens e filtrar apenas projetos ativos
      const allProjects = (response.data.data || []).map((project) => ({
        ...project,
        imagem_destaque:
          project.imagem_destaque && !project.imagem_destaque.startsWith("http")
            ? `${base}${project.imagem_destaque}`
            : project.imagem_destaque,
      }));
      const activeProjects = allProjects.filter((project) => project.ativo);
      setProjects(activeProjects);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Documentos de Transparência
  const [transparenciaDocs, setTransparenciaDocs] = useState([]);
  const [loadingTransparencia, setLoadingTransparencia] = useState(false);
  const [showTranspModal, setShowTranspModal] = useState(false);
  const [transpSubmitting, setTranspSubmitting] = useState(false);
  const [transpError, setTranspError] = useState("");
  const [transpEditingDoc, setTranspEditingDoc] = useState(null);
  const [transpForm, setTranspForm] = useState({
    titulo: "",
    descricao: "",
    ano: new Date().getFullYear().toString(),
    tipo: "Relatorio",
    ficheiro: null,
  });

  const fetchTransparencia = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchTransparencia();
  }, [fetchTransparencia]);

  // Buscar conteúdo institucional
  const fetchConteudo = useCallback(async () => {
    try {
      setLoadingContent(true);
      const response = await api.get("/conteudo");
      if (response.data.success) {
        const base = getBaseUrl();
        const normalized = (response.data.data || []).map((item) => ({
          ...item,
          imagem:
            item.imagem && !item.imagem.startsWith("http")
              ? `${base}${item.imagem}`
              : item.imagem,
        }));
        const withMedia = await Promise.all(
          normalized.map(async (item) => ({
            ...item,
            media: await fetchMediaForItem("conteudo_institucional", item.id),
          })),
        );
        setConteudoInstitucional(withMedia);
      }
    } catch (error) {
      console.error("Erro ao carregar conteúdo:", error);
    } finally {
      setLoadingContent(false);
    }
  }, [fetchMediaForItem]);

  useEffect(() => {
    fetchConteudo();
  }, [fetchConteudo]);

  // Buscar respostas sociais
  const fetchRespostas = useCallback(async () => {
    try {
      setLoadingRespostas(true);
      const response = await api.get("/respostas-sociais");
      if (response.data.success) {
        const base = getBaseUrl();
        const normalized = (response.data.data || []).map((item) => ({
          ...item,
          imagem_destaque:
            item.imagem_destaque && !item.imagem_destaque.startsWith("http")
              ? `${base}${item.imagem_destaque}`
              : item.imagem_destaque,
        }));
        const withMedia = await Promise.all(
          normalized.map(async (item) => ({
            ...item,
            media: await fetchMediaForItem("respostas_sociais", item.id),
          })),
        );
        setRespostasSociais(withMedia);
      }
    } catch (error) {
      console.error("Erro ao carregar respostas sociais:", error);
    } finally {
      setLoadingRespostas(false);
    }
  }, [fetchMediaForItem]);

  useEffect(() => {
    fetchRespostas();
  }, [fetchRespostas]);

  // Buscar notícias
  const fetchNoticias = useCallback(async () => {
    try {
      setLoadingNoticias(true);
      const response = await api.get("/noticias");
      if (response.data.success) {
        const base = getBaseUrl();
        const normalized = (response.data.data || []).map((n) => {
          const obj = { ...n };
          if (obj.imagem_destaque && !obj.imagem_destaque.startsWith("http")) {
            obj.imagem_destaque = `${base}${obj.imagem_destaque}`;
          }
          return obj;
        });
        const withMedia = await Promise.all(
          normalized.map(async (item) => ({
            ...item,
            media: await fetchMediaForItem("noticias_eventos", item.id),
          })),
        );
        setNoticias(withMedia);
      }
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
    } finally {
      setLoadingNoticias(false);
    }
  }, [fetchMediaForItem]);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  // Buscar itens de uma seção específica
  const fetchItensSecao = useCallback(
    async (secaoId) => {
      try {
        const base = getBaseUrl();
        const itensResp = await api.get(
          `/secoes-personalizadas/${secaoId}/itens`,
        );
        if (itensResp.data.success) {
          const normalized = (itensResp.data.data || []).map((item) => ({
            ...item,
            imagem:
              item.imagem && !item.imagem.startsWith("http")
                ? `${base}${item.imagem}`
                : item.imagem,
          }));
          const withMedia = await Promise.all(
            normalized.map(async (item) => ({
              ...item,
              media: await fetchMediaForItem(
                "itens_secoes_personalizadas",
                item.id,
              ),
            })),
          );
          setItensSecoesPersonalizadas((prev) => ({
            ...prev,
            [secaoId]: withMedia,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar itens da seção:", error);
      }
    },
    [fetchMediaForItem],
  );

  // Buscar seções personalizadas
  useEffect(() => {
    const fetchSecoesPersonalizadas = async () => {
      try {
        setLoadingSecoes(true);
        const response = await api.get("/secoes-personalizadas");
        if (response.data.success) {
          const base = getBaseUrl();
          const secoes = (response.data.data || []).map((s) => ({
            ...s,
            config_formulario: parseFormConfig(s.config_formulario),
          }));
          setSecoesPersonalizadas(secoes);

          // Buscar itens de cada seção
          const itensMap = {};
          for (const secao of secoes) {
            const itensResp = await api.get(
              `/secoes-personalizadas/${secao.id}/itens`,
            );
            if (itensResp.data.success) {
              const normalized = (itensResp.data.data || []).map((item) => ({
                ...item,
                imagem:
                  item.imagem && !item.imagem.startsWith("http")
                    ? `${base}${item.imagem}`
                    : item.imagem,
              }));
              itensMap[secao.id] = await Promise.all(
                normalized.map(async (item) => ({
                  ...item,
                  media: await fetchMediaForItem(
                    "itens_secoes_personalizadas",
                    item.id,
                  ),
                })),
              );
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
  }, [fetchMediaForItem]);

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
  const handleEdit = async (
    section,
    data = {},
    id = null,
    secaoPersonalizadaData = null,
  ) => {
    lastFocusedRef.current = document.activeElement;
    resetMediaState();
    setEditingSection(section);
    const normalizedData =
      section === "respostas-sociais" ||
      section === "noticias" ||
      section === "instituicao" ||
      section === "secao-personalizada"
        ? {
            ...data,
            destaques: normalizeRespostaDestaques(data?.destaques),
          }
        : data;
    setEditingData(normalizedData);
    setEditingId(id);
    if (secaoPersonalizadaData) {
      setEditingSecaoPersonalizada(secaoPersonalizadaData);
    }
    setShowEditModal(true);
    if (id) {
      await loadExistingMediaForEdit(section, id);
    }
  };

  // Adicionar nova subseção
  const handleAddSubsection = (
    section = "instituicao",
    secaoPersonalizadaData = null,
  ) => {
    lastFocusedRef.current = document.activeElement;
    console.log("handleAddSubsection - section:", section);
    resetMediaState();
    setEditingSection(section);

    if (secaoPersonalizadaData) {
      setEditingSecaoPersonalizada(secaoPersonalizadaData);
      setEditingData({
        titulo: "",
        subtitulo: "",
        conteudo: "",
        imagem: "",
        destaques: [],
      });
    } else if (section === "respostas-sociais") {
      setEditingData({
        titulo: "",
        descricao: "",
        conteudo: "",
        destaques: [],
        imagem_destaque: "",
      });
    } else if (section === "noticias") {
      setEditingData({
        titulo: "",
        resumo: "",
        conteudo: "",
        tipo: "noticia",
        imagem_destaque: "",
        destaques: [],
      });
    } else {
      setEditingData({
        titulo: "",
        resumo: "",
        conteudo: "",
        imagem_destaque: "",
        destaques: [],
      });
    }
    setEditingId(null);
    setShowAddModal(true);
  };

  const goToTransparencyAdmin = () => {
    setTranspEditingDoc(null);
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

  const handleTranspEdit = (doc) => {
    setTranspEditingDoc(doc);
    setShowTranspModal(true);
    setTranspError("");
    setTranspSubmitting(false);
    setTranspForm({
      titulo: doc.titulo || "",
      descricao: doc.descricao || "",
      ano: (doc.ano || new Date().getFullYear()).toString(),
      tipo: doc.tipo || "Relatorio",
      ficheiro: null,
    });
  };

  const handleTranspSubmit = async (e) => {
    e.preventDefault();
    setTranspError("");

    if (
      !transpForm.titulo.trim() ||
      !transpForm.ano ||
      (!transpEditingDoc && !transpForm.ficheiro)
    ) {
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
    if (transpForm.ficheiro) {
      payload.append("ficheiro", transpForm.ficheiro);
    }
    if (transpForm.descricao.trim())
      payload.append("descricao", transpForm.descricao.trim());
    payload.append("tipo", safeTipo);

    try {
      setTranspSubmitting(true);
      const endpoint = transpEditingDoc
        ? `/transparencia/${transpEditingDoc.id}`
        : "/transparencia";
      const method = transpEditingDoc ? "put" : "post";

      await api[method](endpoint, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowTranspModal(false);
      setTranspEditingDoc(null);
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

  const handleTranspDelete = async (docId) => {
    const confirmed = window.confirm(
      "Tem a certeza que deseja eliminar este documento?",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/transparencia/${docId}`);
      await fetchTransparencia();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Erro ao eliminar documento.";
      setTranspError(msg);
    }
  };

  // Salvar nova subseção
  const handleSaveNew = async (e) => {
    e.preventDefault();
    try {
      let response;

      let createdId = null;
      let mediaSection = editingSection;
      const secaoIdForMedia = editingSecaoPersonalizada?.id || null;

      if (editingSecaoPersonalizada) {
        // Criar item de seção personalizada
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        response = await api.post(
          `/secoes-personalizadas/${editingSecaoPersonalizada.id}/itens`,
          payload,
        );
        if (response.data.success) {
          createdId = response.data.data?.id || null;
          mediaSection = "secao-personalizada";
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
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        response = await api.post("/respostas-sociais", payload);
        if (response.data.success) {
          createdId = response.data.data?.id || null;
          setRespostasSociais([...respostasSociais, response.data.data]);
        }
      } else if (editingSection === "noticias") {
        const payload = {
          ...editingData,
          publicado: true,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        response = await api.post("/noticias", payload);
        if (response.data.success) {
          createdId = response.data.data?.id || null;
          setNoticias([...noticias, response.data.data]);
        }
      } else {
        console.log("Enviando para /conteudo:", editingData);
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        response = await api.post("/conteudo", payload);
        console.log("Resposta de /conteudo:", response.data);
        if (response.data.success) {
          createdId = response.data.data?.id || null;
          setConteudoInstitucional([
            ...conteudoInstitucional,
            response.data.data,
          ]);
        }
      }

      const tabelaRef = getMediaTableForSection(mediaSection);
      if (tabelaRef && createdId) {
        await uploadPendingMediaForItem(tabelaRef, createdId);
        await refreshItemMedia(
          mediaSection === "secao-personalizada"
            ? "secao-personalizada"
            : mediaSection,
          createdId,
          secaoIdForMedia,
        );
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
    const confirmed = await confirmAction(
      "Tem certeza que deseja eliminar este item?",
    );
    if (!confirmed) return;
    try {
      if (section === "secao-personalizada" && secaoId) {
        await api.delete(`/secoes-personalizadas/${secaoId}/itens/${id}`);
        setItensSecoesPersonalizadas({
          ...itensSecoesPersonalizadas,
          [secaoId]: (itensSecoesPersonalizadas[secaoId] || []).filter(
            (item) => item.id !== id,
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
          conteudoInstitucional.filter((c) => c.id !== id),
        );
      }
      alert("Item eliminado com sucesso!");
    } catch (error) {
      console.error("Erro ao eliminar:", error);
      alert("Erro ao eliminar item.");
    }
  };

  // Funções de Drag and Drop
  const handleDragStart = (e, item, section, secaoId = null) => {
    setDraggedItem(item);
    setDraggedSection(section);
    setDraggedSecaoId(secaoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetItem, section, secaoId = null) => {
    e.preventDefault();
    if (
      !draggedItem ||
      draggedItem.id === targetItem.id ||
      draggedSection !== section ||
      (section === "secao-personalizada" && draggedSecaoId !== secaoId)
    ) {
      setDraggedItem(null);
      setDraggedSection(null);
      setDraggedSecaoId(null);
      return;
    }

    try {
      let items = [];
      let endpoint = "";

      if (section === "secao-personalizada" && secaoId) {
        items = itensSecoesPersonalizadas[secaoId] || [];
        endpoint = `/secoes-personalizadas/${secaoId}/itens`;
      } else if (section === "respostas-sociais") {
        items = respostasSociais;
        endpoint = "/respostas-sociais";
      } else if (section === "noticias") {
        items = noticias;
        endpoint = "/noticias";
      } else if (section === "institucional") {
        items = conteudoInstitucional;
        endpoint = "/conteudo";
      } else if (section === "projetos") {
        items = projects;
        endpoint = "/projetos";
      } else if (section === "transparencia") {
        items = transparenciaDocs;
        endpoint = "/transparencia";
      }

      const draggedIndex = items.findIndex((i) => i.id === draggedItem.id);
      const targetIndex = items.findIndex((i) => i.id === targetItem.id);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedItem(null);
        setDraggedSection(null);
        setDraggedSecaoId(null);
        return;
      }

      const newItems = [...items];
      // Trocar diretamente as posições dos dois items
      [newItems[draggedIndex], newItems[targetIndex]] = [
        newItems[targetIndex],
        newItems[draggedIndex],
      ];

      // Atualizar ordem no backend
      const updatePromises = newItems.map((item, index) =>
        api.put(`${endpoint}/${item.id}`, {
          ...item,
          ordem: index + 1,
        }),
      );

      await Promise.all(updatePromises);

      // Atualizar estado local
      if (section === "secao-personalizada" && secaoId) {
        setItensSecoesPersonalizadas({
          ...itensSecoesPersonalizadas,
          [secaoId]: newItems,
        });
        await fetchItensSecao(secaoId);
      } else if (section === "respostas-sociais") {
        await fetchRespostas();
      } else if (section === "noticias") {
        await fetchNoticias();
      } else if (section === "institucional") {
        await fetchConteudo();
      } else if (section === "projetos") {
        await fetchProjects();
      } else if (section === "transparencia") {
        await fetchTransparencia();
      }

      setDraggedItem(null);
      setDraggedSection(null);
      setDraggedSecaoId(null);
    } catch (error) {
      console.error("Erro ao reordenar:", error);
      alert("Erro ao alterar ordem do item.");
      setDraggedItem(null);
      setDraggedSection(null);
      setDraggedSecaoId(null);
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

  const openCustomItem = async (item) => {
    lastFocusedRef.current = document.activeElement;
    try {
      const media = await fetchMediaForItem(
        "itens_secoes_personalizadas",
        item.id,
      );
      setSelectedCustomItem({ ...item, media });
    } catch (error) {
      console.error("Erro ao obter media do item:", error);
      setSelectedCustomItem(item);
    }
    setShowCustomItemModal(true);
  };

  const openInstitutional = async (item) => {
    lastFocusedRef.current = document.activeElement;
    try {
      const media = await fetchMediaForItem("conteudo_institucional", item.id);
      setSelectedInstitutional({ ...item, media });
    } catch (error) {
      console.error("Erro ao obter media institucional:", error);
      setSelectedInstitutional(item);
    }
  };

  const openResposta = async (resposta) => {
    lastFocusedRef.current = document.activeElement;
    try {
      const resp = await api.get(`/respostas-sociais/${resposta.id}`);
      if (resp.data && resp.data.success) {
        const base = getBaseUrl();
        const data = resp.data.data || {};
        if (data.imagem_destaque && !data.imagem_destaque.startsWith("http")) {
          data.imagem_destaque = `${base}${data.imagem_destaque}`;
        }
        if (Array.isArray(data.media)) {
          data.media = normalizeMediaUrls(data.media);
        }
        setSelectedResposta(data);
      } else {
        setSelectedResposta(resposta);
      }
    } catch (error) {
      console.error("Erro ao obter resposta social:", error);
      setSelectedResposta(resposta);
    }
  };

  const focusFirstElement = (ref) => {
    if (!ref?.current) return;
    const el = ref.current.querySelector(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    if (el) el.focus();
  };

  const handleActionKeyDown = (event, action) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  const handleModalKeyDown = (event, modalRef, onClose) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const modal = modalRef?.current;
    if (!modal) return;
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const confirmAction = (message) =>
    new Promise((resolve) => {
      setConfirmState({ open: true, message, resolve });
    });

  const handleConfirm = (confirmed) => {
    if (confirmState.resolve) confirmState.resolve(confirmed);
    setConfirmState({ open: false, message: "", resolve: null });
  };

  const alert = (message) => toast(message);

  const setImageWarning = (key, message) => {
    setImageWarnings((prev) => ({ ...prev, [key]: message }));
  };

  const clearImageWarning = (key) => {
    setImageWarnings((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearFormError = (formKey, field) => {
    if (!field) return;
  };

  const renderFieldError = () => null;

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

  useEffect(() => {
    if (showTranspModal) {
      setTimeout(() => focusFirstElement(transpModalRef), 0);
    }
  }, [showTranspModal]);

  useEffect(() => {
    if (confirmState.open) {
      setTimeout(() => focusFirstElement(confirmModalRef), 0);
    }
  }, [confirmState.open]);

  useEffect(() => {
    if (showCustomItemModal) {
      setTimeout(() => focusFirstElement(customItemModalRef), 0);
    }
  }, [showCustomItemModal]);

  useEffect(() => {
    if (selectedInstitutional) {
      setTimeout(() => focusFirstElement(institutionalModalRef), 0);
    }
  }, [selectedInstitutional]);

  useEffect(() => {
    if (selectedResposta) {
      setTimeout(() => focusFirstElement(respostaModalRef), 0);
    }
  }, [selectedResposta]);

  const closeEditModal = () => {
    setShowEditModal(false);
    resetMediaState();
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetMediaState();
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
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        await api.put(
          `/secoes-personalizadas/${editingSecaoPersonalizada.id}/itens/${editingId}`,
          payload,
        );
        await uploadPendingMediaForItem(
          getMediaTableForSection("secao-personalizada"),
          editingId,
        );
        await refreshItemMedia(
          "secao-personalizada",
          editingId,
          editingSecaoPersonalizada.id,
        );
        setItensSecoesPersonalizadas({
          ...itensSecoesPersonalizadas,
          [editingSecaoPersonalizada.id]: (
            itensSecoesPersonalizadas[editingSecaoPersonalizada.id] || []
          ).map((item) =>
            item.id === editingId ? { ...item, ...payload } : item,
          ),
        });
        closeEditModal();
        alert("Item atualizado com sucesso!");
      } else if (editingSection === "institucional" && editingId) {
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        await api.put(`/conteudo/${editingId}`, payload);
        await uploadPendingMediaForItem(
          getMediaTableForSection(editingSection),
          editingId,
        );
        await refreshItemMedia("institucional", editingId);
        setConteudoInstitucional(
          conteudoInstitucional.map((c) =>
            c.id === editingId ? { ...c, ...payload } : c,
          ),
        );
        closeEditModal();
        alert("Conteúdo atualizado com sucesso!");
      } else if (editingSection === "respostas-sociais" && editingId) {
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        await api.put(`/respostas-sociais/${editingId}`, payload);
        await uploadPendingMediaForItem(
          getMediaTableForSection(editingSection),
          editingId,
        );
        await refreshItemMedia("respostas-sociais", editingId);
        setRespostasSociais(
          respostasSociais.map((r) =>
            r.id === editingId ? { ...r, ...payload } : r,
          ),
        );
        closeEditModal();
        alert("Resposta Social atualizada com sucesso!");
      } else if (editingSection === "noticias" && editingId) {
        const payload = {
          ...editingData,
          destaques: serializeRespostaDestaques(editingData?.destaques),
        };
        await api.put(`/noticias/${editingId}`, payload);
        await uploadPendingMediaForItem(
          getMediaTableForSection(editingSection),
          editingId,
        );
        await refreshItemMedia("noticias", editingId);
        setNoticias(
          noticias.map((n) => (n.id === editingId ? { ...n, ...payload } : n)),
        );
        closeEditModal();
        alert("Notícia atualizada com sucesso!");
      } else if (editingSection === "hero") {
        const payload = {
          titulo: editingData.titulo || heroConfig.titulo,
          subtitulo: editingData.subtitulo || heroConfig.subtitulo,
          imagem_fundo: editingData.imagem_fundo || heroConfig.imagem_fundo,
        };

        const response = await api.put("/hero", payload);
        const savedHero = normalizeHeroConfig(response.data?.data || payload);
        setHeroConfig(savedHero);
        localStorage.setItem("heroConfig", JSON.stringify(savedHero));
        closeEditModal();
        alert("Hero atualizado com sucesso!");
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
      <main id="conteudo">
        <section
          className="hero-section"
          style={{
            backgroundImage: heroConfig.imagem_fundo
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroConfig.imagem_fundo})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="container">
            {isEditMode && user && (
              <button
                className="btn-edit-inline btn-edit-hero"
                onClick={() =>
                  handleEdit("hero", {
                    titulo: heroConfig.titulo,
                    subtitulo: heroConfig.subtitulo,
                    imagem_fundo: heroConfig.imagem_fundo,
                  })
                }
                title="Editar Hero"
                aria-label="Editar secção principal"
              >
                ✏️
              </button>
            )}
            <h1>{heroConfig.titulo}</h1>
            <p>{heroConfig.subtitulo}</p>
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
                    draggable={isEditMode && user ? true : false}
                    onDragStart={(e) =>
                      isEditMode && handleDragStart(e, content, "institucional")
                    }
                    onDragOver={isEditMode ? handleDragOver : undefined}
                    onDrop={(e) =>
                      isEditMode && handleDrop(e, content, "institucional")
                    }
                    onClick={() => !isEditMode && openInstitutional(content)}
                    style={{
                      cursor: isEditMode && user ? "move" : "pointer",
                      opacity: draggedItem?.id === content.id ? 0.5 : 1,
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      !isEditMode &&
                      !e.target.closest(".subsection-actions") &&
                      handleActionKeyDown(e, () => openInstitutional(content))
                    }
                  >
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
                              handleDelete(content.id, "institucional")
                            }
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {content.subtitulo && (
                      <p
                        className="content-summary"
                        style={{ fontStyle: "italic", marginTop: 8 }}
                      >
                        {content.subtitulo}
                      </p>
                    )}
                    {(() => {
                      const destaques = buildRespostaDestaques(
                        content?.destaques,
                      );
                      if (!destaques.length) return null;
                      return (
                        <div
                          className={`resposta-highlights resposta-highlights--${destaques.length}`}
                        >
                          {destaques.map((item, idx) => (
                            <div
                              key={`content-destaque-${idx}`}
                              className="resposta-highlight"
                            >
                              {item.titulo && (
                                <div className="resposta-highlight-title">
                                  {item.titulo}
                                </div>
                              )}
                              {item.texto && (
                                <div className="resposta-highlight-text">
                                  {item.texto}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div
                      className="content-preview"
                      dangerouslySetInnerHTML={{
                        __html: content.conteudo || "",
                      }}
                    />
                    <InlineGallery
                      images={buildGalleryImages(
                        content.imagem,
                        content.media || [],
                      )}
                      altPrefix={content.titulo || "Imagem"}
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

            {loadingProjects ? (
              <div className="loading-projects">A carregar projetos...</div>
            ) : projects.length === 0 ? (
              <p className="no-projects">
                Nenhum projeto disponível no momento.
              </p>
            ) : (
              <div className="projects-list">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-item ${
                      project.url_externa ? "clickable" : ""
                    }`}
                    draggable={isEditMode && user ? true : false}
                    onDragStart={(e) =>
                      isEditMode && handleDragStart(e, project, "projetos")
                    }
                    onDragOver={isEditMode ? handleDragOver : undefined}
                    onDrop={(e) =>
                      isEditMode && handleDrop(e, project, "projetos")
                    }
                    onClick={() => {
                      if (!isEditMode && project.url_externa) {
                        window.open(project.url_externa, "_blank");
                      }
                    }}
                    style={{
                      cursor:
                        isEditMode && user
                          ? "move"
                          : project.url_externa
                            ? "pointer"
                            : "default",
                      opacity: draggedItem?.id === project.id ? 0.5 : 1,
                    }}
                    role={project.url_externa ? "link" : undefined}
                    tabIndex={project.url_externa ? 0 : undefined}
                    aria-label={
                      project.url_externa
                        ? `Abrir projeto ${project.titulo} (nova janela)`
                        : undefined
                    }
                    onKeyDown={(e) => {
                      if (!project.url_externa || isEditMode) return;
                      handleActionKeyDown(e, () =>
                        window.open(project.url_externa, "_blank"),
                      );
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
                            "pt-PT",
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
                    draggable={isEditMode && user ? true : false}
                    onDragStart={(e) =>
                      isEditMode &&
                      handleDragStart(e, resposta, "respostas-sociais")
                    }
                    onDragOver={isEditMode ? handleDragOver : undefined}
                    onDrop={(e) =>
                      isEditMode && handleDrop(e, resposta, "respostas-sociais")
                    }
                    onClick={() => !isEditMode && openResposta(resposta)}
                    style={{
                      cursor: isEditMode && user ? "move" : "pointer",
                      opacity: draggedItem?.id === resposta.id ? 0.5 : 1,
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      !isEditMode &&
                      !e.target.closest(".subsection-actions") &&
                      handleActionKeyDown(e, () => openResposta(resposta))
                    }
                  >
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
                                resposta.id,
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
                    {(() => {
                      const destaques = buildRespostaDestaques(
                        resposta?.destaques,
                      );
                      if (!destaques.length) return null;
                      return (
                        <div
                          className={`resposta-highlights resposta-highlights--${destaques.length}`}
                        >
                          {destaques.map((item, idx) => (
                            <div
                              key={`resposta-card-destaque-${idx}`}
                              className="resposta-highlight"
                            >
                              {item.titulo && (
                                <div className="resposta-highlight-title">
                                  {item.titulo}
                                </div>
                              )}
                              {item.texto && (
                                <div className="resposta-highlight-text">
                                  {item.texto}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {(() => {
                      const hasConteudo = !!stripHtml(resposta.conteudo || "");
                      if (resposta.descricao && hasConteudo) {
                        return (
                          <p
                            className="content-summary"
                            style={{ fontStyle: "italic", marginTop: 8 }}
                          >
                            {resposta.descricao}
                          </p>
                        );
                      }
                      return null;
                    })()}
                    <div
                      className="content-preview"
                      dangerouslySetInnerHTML={{
                        __html: resposta.conteudo || resposta.descricao || "",
                      }}
                    />
                    <InlineGallery
                      images={buildGalleryImages(
                        resposta.imagem_destaque,
                        resposta.media || [],
                      )}
                      altPrefix={resposta.titulo || "Imagem"}
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
                    draggable={isEditMode && user ? true : false}
                    onDragStart={(e) =>
                      isEditMode && handleDragStart(e, noticia, "noticias")
                    }
                    onDragOver={isEditMode ? handleDragOver : undefined}
                    onDrop={(e) =>
                      isEditMode && handleDrop(e, noticia, "noticias")
                    }
                    onClick={() => !isEditMode && openNews(noticia)}
                    style={{
                      cursor: isEditMode && user ? "move" : "pointer",
                      opacity: draggedItem?.id === noticia.id ? 0.5 : 1,
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      !isEditMode &&
                      !e.target.closest(".subsection-actions") &&
                      handleActionKeyDown(e, () => openNews(noticia))
                    }
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
                          stripHtml(noticia.conteudo || "").slice(0, 200) +
                            "..."}
                      </p>
                      {(() => {
                        const destaques = buildRespostaDestaques(
                          noticia?.destaques,
                        );
                        if (!destaques.length) return null;
                        return (
                          <div
                            className={`resposta-highlights resposta-highlights--${destaques.length}`}
                            style={{ marginTop: "1rem" }}
                          >
                            {destaques.map((item, idx) => (
                              <div
                                key={`noticia-destaque-${idx}`}
                                className="resposta-highlight"
                              >
                                {item.titulo && (
                                  <div className="resposta-highlight-title">
                                    {item.titulo}
                                  </div>
                                )}
                                {item.texto && (
                                  <div className="resposta-highlight-text">
                                    {item.texto}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <InlineGallery
                        images={buildGalleryImages(
                          noticia.imagem_destaque,
                          noticia.media || [],
                        )}
                        altPrefix={noticia.titulo || "Imagem"}
                      />
                    </div>

                    <p className="noticia-date">
                      📅{" "}
                      {new Date(
                        noticia.data_publicacao || noticia.created_at,
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
                  <div
                    key={doc.id}
                    className="transparency-card"
                    draggable={isEditMode && user ? true : false}
                    onDragStart={(e) =>
                      isEditMode && handleDragStart(e, doc, "transparencia")
                    }
                    onDragOver={isEditMode ? handleDragOver : undefined}
                    onDrop={(e) =>
                      isEditMode && handleDrop(e, doc, "transparencia")
                    }
                    style={{
                      cursor: isEditMode && user ? "move" : "default",
                      opacity: draggedItem?.id === doc.id ? 0.5 : 1,
                    }}
                  >
                    {isEditMode && user && (
                      <div className="transparency-actions">
                        <button
                          className="btn-edit-inline"
                          title="Editar documento"
                          onClick={() => handleTranspEdit(doc)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-inline"
                          title="Eliminar documento"
                          onClick={() => handleTranspDelete(doc.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
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
                              doc.data_criacao,
                            )}`
                          : ""}
                      </p>
                      {doc.descricao && (
                        <p className="transparency-desc">{doc.descricao}</p>
                      )}
                      {doc.ficheiro_url && (
                        <button
                          className="btn-primary"
                          onClick={() =>
                            window.open(doc.ficheiro_url, "_blank")
                          }
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
          (o) => o.tipo === selectedFormType,
        )?.label;
        const formKey = `${secao.id}-${selectedFormType || "none"}`;

          const crecheSections = secoesPersonalizadas.filter((s) => {
            const key = `${s.slug || ""} ${s.nome || ""} ${
              s.titulo || ""
            }`.toLowerCase();
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
                ) : itens.length === 0 ? null : secao.tipo_layout ===
                  "texto" ? (
                  /* Layout TEXTO - Mostra tudo expandido (como Valores) */
                  <div className="text-layout-content">
                    {itens.map((item) => (
                      <div
                        key={item.id}
                        className="text-item-full"
                        draggable={isEditMode && user ? true : false}
                        onDragStart={(e) =>
                          isEditMode &&
                          handleDragStart(
                            e,
                            item,
                            "secao-personalizada",
                            secao.id,
                          )
                        }
                        onDragOver={isEditMode ? handleDragOver : undefined}
                        onDrop={(e) =>
                          isEditMode &&
                          handleDrop(e, item, "secao-personalizada", secao.id)
                        }
                        style={{
                          cursor: isEditMode && user ? "move" : "default",
                          opacity: draggedItem?.id === item.id ? 0.5 : 1,
                        }}
                      >
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
                                  secao,
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
                                  secao.id,
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
                        {(() => {
                          const destaques = buildRespostaDestaques(
                            item?.destaques,
                          );
                          if (!destaques.length) return null;
                          return (
                            <div
                              className={`resposta-highlights resposta-highlights--${destaques.length}`}
                            >
                              {destaques.map((destItem, idx) => (
                                <div
                                  key={`item-destaque-${idx}`}
                                  className="resposta-highlight"
                                >
                                  {destItem.titulo && (
                                    <div className="resposta-highlight-title">
                                      {destItem.titulo}
                                    </div>
                                  )}
                                  {destItem.texto && (
                                    <div className="resposta-highlight-text">
                                      {destItem.texto}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {item.conteudo && (
                          <div
                            className="text-content-full"
                            dangerouslySetInnerHTML={{ __html: item.conteudo }}
                          />
                        )}
                        <InlineGallery
                          images={buildGalleryImages(
                            item.imagem,
                            item.media || [],
                          )}
                          altPrefix={item.titulo || "Imagem"}
                        />
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
                        draggable={isEditMode && user ? true : false}
                        onDragStart={(e) =>
                          isEditMode &&
                          handleDragStart(
                            e,
                            item,
                            "secao-personalizada",
                            secao.id,
                          )
                        }
                        onDragOver={isEditMode ? handleDragOver : undefined}
                        onDrop={(e) =>
                          isEditMode &&
                          handleDrop(e, item, "secao-personalizada", secao.id)
                        }
                        onClick={(e) => {
                          // Não abrir se clicou num botão ou em modo de edição
                          if (
                            e.target.closest(".subsection-actions") ||
                            isEditMode
                          )
                            return;
                          openCustomItem(item);
                        }}
                        style={{
                          cursor: isEditMode && user ? "move" : "pointer",
                          opacity: draggedItem?.id === item.id ? 0.5 : 1,
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (
                            !e.target.closest(".subsection-actions") &&
                            !isEditMode
                          ) {
                            handleActionKeyDown(e, () => openCustomItem(item));
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
                                  secao,
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
                                  secao.id,
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
                        {item.subtitulo && (
                          <div className="gallery-subtitle">
                            {item.subtitulo}
                          </div>
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
                        draggable={isEditMode && user ? true : false}
                        onDragStart={(e) =>
                          isEditMode &&
                          handleDragStart(
                            e,
                            item,
                            "secao-personalizada",
                            secao.id,
                          )
                        }
                        onDragOver={isEditMode ? handleDragOver : undefined}
                        onDrop={(e) =>
                          isEditMode &&
                          handleDrop(e, item, "secao-personalizada", secao.id)
                        }
                        onClick={(e) => {
                          // Não abrir se clicou num botão ou em modo de edição
                          if (
                            e.target.closest(".subsection-actions") ||
                            isEditMode
                          )
                            return;
                          openCustomItem(item);
                        }}
                        style={{
                          cursor: isEditMode && user ? "move" : "pointer",
                          opacity: draggedItem?.id === item.id ? 0.5 : 1,
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (
                            !e.target.closest(".subsection-actions") &&
                            !isEditMode
                          ) {
                            handleActionKeyDown(e, () => openCustomItem(item));
                          }
                        }}
                      >
                        {item.imagem && (
                          <img
                            src={item.imagem}
                            alt={item.titulo || "Imagem"}
                            className="content-image"
                            style={{
                              marginBottom: "0.75rem",
                              maxWidth: "100%",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = PLACEHOLDER_SVG;
                            }}
                          />
                        )}
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
                                    secao,
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
                                    secao.id,
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
                        {(() => {
                          const destaques = buildRespostaDestaques(
                            item?.destaques,
                          );
                          if (!destaques.length) return null;
                          return (
                            <div
                              className={`resposta-highlights resposta-highlights--${destaques.length}`}
                              style={{ marginTop: "0.75rem" }}
                            >
                              {destaques.map((destItem, idx) => (
                                <div
                                  key={`lista-destaque-${idx}`}
                                  className="resposta-highlight"
                                >
                                  {destItem.titulo && (
                                    <div className="resposta-highlight-title">
                                      {destItem.titulo}
                                    </div>
                                  )}
                                  {destItem.texto && (
                                    <div className="resposta-highlight-text">
                                      {destItem.texto}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        <InlineGallery
                          images={buildGalleryImages(
                            item.imagem,
                            item.media || [],
                          )}
                          altPrefix={item.titulo || "Imagem"}
                        />
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
                        draggable={isEditMode && user ? true : false}
                        onDragStart={(e) =>
                          isEditMode &&
                          handleDragStart(
                            e,
                            item,
                            "secao-personalizada",
                            secao.id,
                          )
                        }
                        onDragOver={isEditMode ? handleDragOver : undefined}
                        onDrop={(e) =>
                          isEditMode &&
                          handleDrop(e, item, "secao-personalizada", secao.id)
                        }
                        onClick={(e) => {
                          // Não abrir se clicou num botão ou em modo de edição
                          if (
                            e.target.closest(".subsection-actions") ||
                            isEditMode
                          )
                            return;
                          if (item.link_externo) {
                            window.open(item.link_externo, "_blank");
                          } else {
                            openCustomItem(item);
                          }
                        }}
                        style={{
                          cursor: isEditMode && user ? "move" : "pointer",
                          opacity: draggedItem?.id === item.id ? 0.5 : 1,
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (
                            !e.target.closest(".subsection-actions") &&
                            !isEditMode
                          ) {
                            handleActionKeyDown(e, () => {
                              if (item.link_externo) {
                                window.open(item.link_externo, "_blank");
                              } else {
                                openCustomItem(item);
                              }
                            });
                          }
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
                                    secao,
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
                                    secao.id,
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
                        {(() => {
                          const destaques = buildRespostaDestaques(
                            item?.destaques,
                          );
                          if (!destaques.length) return null;
                          return (
                            <div
                              className={`resposta-highlights resposta-highlights--${destaques.length}`}
                              style={{ marginTop: "0.75rem" }}
                            >
                              {destaques.map((destItem, idx) => (
                                <div
                                  key={`card-destaque-${idx}`}
                                  className="resposta-highlight"
                                >
                                  {destItem.titulo && (
                                    <div className="resposta-highlight-title">
                                      {destItem.titulo}
                                    </div>
                                  )}
                                  {destItem.texto && (
                                    <div className="resposta-highlight-text">
                                      {destItem.texto}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {item.conteudo && (
                          <div
                            className="content-preview"
                            dangerouslySetInnerHTML={{
                              __html: item.conteudo,
                            }}
                          />
                        )}
                        <InlineGallery
                          images={buildGalleryImages(
                            item.imagem,
                            item.media || [],
                          )}
                          altPrefix={item.titulo || "Imagem"}
                        />
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
                              "Tem certeza que deseja remover o formulário desta secção?",
                            )
                          ) {
                            try {
                              await api.put(
                                `/secoes-personalizadas/${secao.id}`,
                                {
                                  ...secao,
                                  tem_formulario: false,
                                  config_formulario: null,
                                },
                              );
                              setSecoesPersonalizadas(
                                secoesPersonalizadas.map((s) =>
                                  s.id === secao.id
                                    ? {
                                        ...s,
                                        tem_formulario: false,
                                        config_formulario: null,
                                      }
                                    : s,
                                ),
                              );
                              alert("Formulário removido com sucesso!");
                            } catch (error) {
                              console.error(
                                "Erro ao remover formulário:",
                                error,
                              );
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
                        {formConfig.titulo?.trim() && (
                          <p className="form-selector-title">
                            {formConfig.titulo}
                          </p>
                        )}
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
                          onInput={(e) => {
                            if (e.target?.setCustomValidity) {
                              e.target.setCustomValidity("");
                            }
                            clearFormError(formKey, e.target?.name);
                          }}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            if (!form.reportValidity()) return;
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
                                data,
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
                              <label htmlFor={`email-${secao.id}`}>Email</label>
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
                          className="erpi-form"
                          onInput={(e) => {
                            if (e.target?.setCustomValidity) {
                              e.target.setCustomValidity("");
                            }
                            clearFormError(formKey, e.target?.name);
                          }}
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
                              contacto_nome_completo:
                                form.contacto_nome_completo.value,
                              contacto_telefone: form.contacto_telefone.value,
                              contacto_email: form.contacto_email.value,
                              contacto_parentesco:
                                form.contacto_parentesco.value,
                              observacoes: form.observacoes.value,
                              origem_submissao: "site-secao-personalizada",
                              secao_personalizada_id: secao.id,
                              formulario_escolhido:
                                selectedFormLabel || selectedFormType,
                            };

                            const postalInput = form.codigo_postal;
                            const ccInput = form.cc_bi_numero;
                            const nifInput = form.nif;
                            const nissInput = form.niss;
                            const utenteInput = form.numero_utente;
                            const telInput = form.contacto_telefone;

                            if (
                              postalInput?.value &&
                              !isValidPostal(postalInput.value)
                            ) {
                              postalInput.setCustomValidity(
                                "Código postal inválido (0000-000)",
                              );
                            } else if (postalInput) {
                              postalInput.setCustomValidity("");
                            }

                            if (
                              ccInput?.value &&
                              !/^\d{8,9}$/.test(
                                normalizeDigits(ccInput.value),
                              )
                            ) {
                              ccInput.setCustomValidity(
                                "CC/BI deve ter 8 ou 9 dígitos",
                              );
                            } else if (ccInput) {
                              ccInput.setCustomValidity("");
                            }

                            if (
                              nifInput?.value &&
                              !isValidNif(nifInput.value)
                            ) {
                              nifInput.setCustomValidity("NIF inválido");
                            } else if (nifInput) {
                              nifInput.setCustomValidity("");
                            }

                            if (
                              nissInput?.value &&
                              !isValidNiss(nissInput.value)
                            ) {
                              nissInput.setCustomValidity(
                                "NISS deve ter 11 dígitos",
                              );
                            } else if (nissInput) {
                              nissInput.setCustomValidity("");
                            }

                            if (
                              utenteInput?.value &&
                              !isValidUtente(utenteInput.value)
                            ) {
                              utenteInput.setCustomValidity(
                                "Nº utente deve ter 9 dígitos",
                              );
                            } else if (utenteInput) {
                              utenteInput.setCustomValidity("");
                            }

                            if (
                              telInput?.value &&
                              !isValidPhone(telInput.value)
                            ) {
                              telInput.setCustomValidity(
                                "Telefone deve ter 9 dígitos",
                              );
                            } else if (telInput) {
                              telInput.setCustomValidity("");
                            }

                            if (!form.reportValidity()) {
                              return;
                            }

                            try {
                              const resp = await api.post("/forms/erpi", data);
                              if (resp.data?.success) {
                                alert(
                                  "Inscrição ERPI enviada. Entraremos em contacto.",
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
                          <div className="form-row row-name-birth">
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
                              {renderFieldError(formKey, "nome_completo")}
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
                              {renderFieldError(formKey, "data_nascimento")}
                            </div>
                          </div>

                          <div className="form-row row-address">
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
                              {renderFieldError(formKey, "morada_completa")}
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
                              {renderFieldError(formKey, "codigo_postal")}
                            </div>
                          </div>

                          <div className="form-row row-location-2">
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
                              {renderFieldError(formKey, "concelho")}
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
                              {renderFieldError(formKey, "distrito")}
                            </div>
                          </div>

                          <div className="form-row row-id-4">
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
                                  inputMode="numeric"
                                  pattern="[0-9]{8,9}"
                                  title="CC/BI deve ter 8 ou 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "cc_bi_numero")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`nif-${secao.id}`}>NIF</label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`nif-${secao.id}`}
                                  name="nif"
                                  placeholder="NIF"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="NIF deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "nif")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`niss-${secao.id}`}>NISS</label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`niss-${secao.id}`}
                                  name="niss"
                                  placeholder="NISS"
                                  inputMode="numeric"
                                  pattern="[0-9]{11}"
                                  title="NISS deve ter 11 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "niss")}
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
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Nº utente deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "numero_utente")}
                            </div>
                          </div>

                          <div className="form-row row-contact">
                            <div className="form-field">
                              <label
                                htmlFor={`contacto_nome_completo-${secao.id}`}
                              >
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
                              {renderFieldError(formKey, "contacto_nome_completo")}
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
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Telefone deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "contacto_telefone")}
                            </div>
                          </div>

                          <div className="form-row row-contact-2">
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
                              {renderFieldError(formKey, "contacto_email")}
                            </div>
                            <div className="form-field">
                              <label
                                htmlFor={`contacto_parentesco-${secao.id}`}
                              >
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
                              {renderFieldError(formKey, "contacto_parentesco")}
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
                          className="creche-form"
                          onInput={(e) => {
                            if (e.target?.setCustomValidity) {
                              e.target.setCustomValidity("");
                            }
                            clearFormError(formKey, e.target?.name);
                          }}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.currentTarget;

                            const selectedCrecheInput = form.querySelector(
                              'input[name="creche_item_id"]:checked',
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

                            const criancaNasceuValue =
                              form.crianca_nasceu?.value || "";
                            const crianca_nasceu = criancaNasceuValue === "sim";

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
                              apoio_especificacao:
                                form.apoio_especificacao.value,
                              origem_submissao: "site-secao-personalizada",
                              secao_personalizada_id: secao.id,
                              formulario_escolhido:
                                selectedFormLabel || selectedFormType,
                            };

                            const postalInput = form.codigo_postal;
                            const maePostalInput = form.mae_codigo_postal;
                            const paiPostalInput = form.pai_codigo_postal;
                            const ccInput = form.cc_bi_numero;
                            const nifInput = form.nif;
                            const nissInput = form.niss;
                            const utenteInput = form.numero_utente;
                            const maeTelInput = form.mae_telemovel;
                            const paiTelInput = form.pai_telemovel;

                            if (
                              postalInput?.value &&
                              !isValidPostal(postalInput.value)
                            ) {
                              postalInput.setCustomValidity(
                                "Código postal inválido (0000-000)",
                              );
                            } else if (postalInput) {
                              postalInput.setCustomValidity("");
                            }

                            if (
                              maePostalInput?.value &&
                              !isValidPostal(maePostalInput.value)
                            ) {
                              maePostalInput.setCustomValidity(
                                "Código postal inválido (0000-000)",
                              );
                            } else if (maePostalInput) {
                              maePostalInput.setCustomValidity("");
                            }

                            if (
                              paiPostalInput?.value &&
                              !isValidPostal(paiPostalInput.value)
                            ) {
                              paiPostalInput.setCustomValidity(
                                "Código postal inválido (0000-000)",
                              );
                            } else if (paiPostalInput) {
                              paiPostalInput.setCustomValidity("");
                            }

                            if (
                              ccInput?.value &&
                              !/^\d{8,9}$/.test(
                                normalizeDigits(ccInput.value),
                              )
                            ) {
                              ccInput.setCustomValidity(
                                "CC/BI deve ter 8 ou 9 dígitos",
                              );
                            } else if (ccInput) {
                              ccInput.setCustomValidity("");
                            }

                            if (
                              nifInput?.value &&
                              !isValidNif(nifInput.value)
                            ) {
                              nifInput.setCustomValidity("NIF inválido");
                            } else if (nifInput) {
                              nifInput.setCustomValidity("");
                            }

                            if (
                              nissInput?.value &&
                              !isValidNiss(nissInput.value)
                            ) {
                              nissInput.setCustomValidity(
                                "NISS deve ter 11 dígitos",
                              );
                            } else if (nissInput) {
                              nissInput.setCustomValidity("");
                            }

                            if (
                              utenteInput?.value &&
                              !isValidUtente(utenteInput.value)
                            ) {
                              utenteInput.setCustomValidity(
                                "Nº utente deve ter 9 dígitos",
                              );
                            } else if (utenteInput) {
                              utenteInput.setCustomValidity("");
                            }

                            if (
                              maeTelInput?.value &&
                              !isValidPhone(maeTelInput.value)
                            ) {
                              maeTelInput.setCustomValidity(
                                "Telemóvel deve ter 9 dígitos",
                              );
                            } else if (maeTelInput) {
                              maeTelInput.setCustomValidity("");
                            }

                            if (
                              paiTelInput?.value &&
                              !isValidPhone(paiTelInput.value)
                            ) {
                              paiTelInput.setCustomValidity(
                                "Telemóvel deve ter 9 dígitos",
                              );
                            } else if (paiTelInput) {
                              paiTelInput.setCustomValidity("");
                            }

                            if (!form.reportValidity()) {
                              return;
                            }

                            try {
                              const resp = await api.post(
                                "/forms/creche",
                                data,
                              );
                              if (resp.data?.success) {
                                alert(
                                  "Inscrição Creche enviada. Entraremos em contacto.",
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
                          <div className="form-field">
                            <label>Escolha a creche</label>
                            <div
                              className="form-selector-options"
                              style={{ marginTop: 4 }}
                            >
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
                            {renderFieldError(formKey, "creche_item_id")}
                          </div>

                          <div className="form-row">
                            <div className="form-field">
                              <fieldset>
                                <legend>A criança já nasceu? *</legend>
                                <div className="radio-group">
                                  <label>
                                    <input
                                      type="radio"
                                      name="crianca_nasceu"
                                      value="sim"
                                      onChange={() => {
                                        setCrecheNasceuState((prev) => ({
                                          ...prev,
                                          [secao.id]: true,
                                        }));
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
                                        setCrecheNasceuState((prev) => ({
                                          ...prev,
                                          [secao.id]: false,
                                        }));
                                      }}
                                      required
                                    />
                                    Não
                                  </label>
                                </div>
                              </fieldset>
                              {renderFieldError(formKey, "crianca_nasceu")}
                            </div>
                          </div>

                          <div className="form-row row-name-birth">
                            <div className="form-field name-field">
                              <label htmlFor={`creche-nome-${secao.id}`}>
                                Nome completo da criança *
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">👶</span>
                                <input
                                  id={`creche-nome-${secao.id}`}
                                  name="nome_completo"
                                  required
                                  placeholder="Nome completo"
                                />
                              </div>
                              {renderFieldError(formKey, "nome_completo")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-data-${secao.id}`}>
                                {crecheNasceuState[secao.id]
                                  ? "Data de nascimento *"
                                  : "Data prevista *"}
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">📅</span>
                                <input
                                  id={`creche-data-${secao.id}`}
                                  type="date"
                                  name={
                                    crecheNasceuState[secao.id]
                                      ? "data_nascimento"
                                      : "data_prevista"
                                  }
                                  min={DATE_MIN}
                                  max={
                                    crecheNasceuState[secao.id]
                                      ? DATE_MAX
                                      : DATE_FUTURE_MAX
                                  }
                                  required
                                />
                              </div>
                              {renderFieldError(
                                formKey,
                                crecheNasceuState[secao.id]
                                  ? "data_nascimento"
                                  : "data_prevista",
                              )}
                            </div>
                          </div>

                          <div className="form-row row-address-3">
                            <div className="form-field">
                              <label htmlFor={`creche-morada-${secao.id}`}>
                                Morada *
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏠</span>
                                <input
                                  id={`creche-morada-${secao.id}`}
                                  name="morada"
                                  required
                                  placeholder="Rua, nº, andar"
                                />
                              </div>
                              {renderFieldError(formKey, "morada")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-localidade-${secao.id}`}>
                                Localidade *
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏘️</span>
                                <input
                                  id={`creche-localidade-${secao.id}`}
                                  name="localidade"
                                  required
                                  placeholder="Localidade"
                                />
                              </div>
                              {renderFieldError(formKey, "localidade")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-cp-${secao.id}`}>
                                Código Postal *
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏷️</span>
                                <input
                                  id={`creche-cp-${secao.id}`}
                                  name="codigo_postal"
                                  required
                                  placeholder="0000-000"
                                  pattern={POSTAL_PATTERN}
                                  title={POSTAL_TITLE}
                                />
                              </div>
                              {renderFieldError(formKey, "codigo_postal")}
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`creche-cc-${secao.id}`}>
                                CC/BI
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🪪</span>
                                <input
                                  id={`creche-cc-${secao.id}`}
                                  name="cc_bi_numero"
                                  placeholder="Número CC/BI"
                                  inputMode="numeric"
                                  pattern="[0-9]{8,9}"
                                  title="CC/BI deve ter 8 ou 9 dígitos"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-nif-${secao.id}`}>
                                NIF
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`creche-nif-${secao.id}`}
                                  name="nif"
                                  placeholder="NIF"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="NIF deve ter 9 dígitos"
                                />
                              </div>
                              {renderFieldError(formKey, "nif")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-niss-${secao.id}`}>
                                NISS
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`creche-niss-${secao.id}`}
                                  name="niss"
                                  placeholder="NISS"
                                  inputMode="numeric"
                                  pattern="[0-9]{11}"
                                  title="NISS deve ter 11 dígitos"
                                />
                              </div>
                              {renderFieldError(formKey, "niss")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-utente-${secao.id}`}>
                                Nº Utente
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">💳</span>
                                <input
                                  id={`creche-utente-${secao.id}`}
                                  name="numero_utente"
                                  placeholder="Número de utente"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Nº utente deve ter 9 dígitos"
                                />
                              </div>
                              {renderFieldError(formKey, "numero_utente")}
                            </div>
                          </div>

                          <h4>Filiação</h4>
                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`creche-mae-nome-${secao.id}`}>
                                Nome da Mãe
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">👩</span>
                                <input
                                  id={`creche-mae-nome-${secao.id}`}
                                  name="mae_nome"
                                  placeholder="Nome da mãe"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-row row-parent-work">
                            <div className="form-field">
                              <label htmlFor={`creche-mae-prof-${secao.id}`}>
                                Profissão
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🧑‍💼</span>
                                <input
                                  id={`creche-mae-prof-${secao.id}`}
                                  name="mae_profissao"
                                  placeholder="Profissão"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-mae-emp-${secao.id}`}>
                                Local de emprego
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏢</span>
                                <input
                                  id={`creche-mae-emp-${secao.id}`}
                                  name="mae_local_emprego"
                                  placeholder="Local de emprego"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-row row-parent-address">
                            <div className="form-field">
                              <label htmlFor={`creche-mae-morada-${secao.id}`}>
                                Morada
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏠</span>
                                <input
                                  id={`creche-mae-morada-${secao.id}`}
                                  name="mae_morada"
                                  placeholder="Morada"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-mae-local-${secao.id}`}>
                                Localidade
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏘️</span>
                                <input
                                  id={`creche-mae-local-${secao.id}`}
                                  name="mae_localidade"
                                  placeholder="Localidade"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-mae-cp-${secao.id}`}>
                                Código Postal
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏷️</span>
                                <input
                                  id={`creche-mae-cp-${secao.id}`}
                                  name="mae_codigo_postal"
                                  placeholder="0000-000"
                                  pattern={POSTAL_PATTERN}
                                  title={POSTAL_TITLE}
                                />
                              </div>
                              {renderFieldError(formKey, "mae_codigo_postal")}
                            </div>
                          </div>
                          <div className="form-row row-parent-contact">
                            <div className="form-field">
                              <label htmlFor={`creche-mae-email-${secao.id}`}>
                                Email
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">✉️</span>
                                <input
                                  id={`creche-mae-email-${secao.id}`}
                                  name="mae_email"
                                  type="email"
                                  placeholder="email@exemplo.pt"
                                />
                              </div>
                              {renderFieldError(formKey, "mae_email")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-mae-tel-${secao.id}`}>
                                Telemóvel
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">📱</span>
                                <input
                                  id={`creche-mae-tel-${secao.id}`}
                                  name="mae_telemovel"
                                  placeholder="Telemóvel"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Telemóvel deve ter 9 dígitos"
                                />
                              </div>
                              {renderFieldError(formKey, "mae_telemovel")}
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-field">
                              <label htmlFor={`creche-pai-nome-${secao.id}`}>
                                Nome do Pai
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">👨</span>
                                <input
                                  id={`creche-pai-nome-${secao.id}`}
                                  name="pai_nome"
                                  placeholder="Nome do pai"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-row row-parent-work">
                            <div className="form-field">
                              <label htmlFor={`creche-pai-prof-${secao.id}`}>
                                Profissão do pai
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🧑‍💼</span>
                                <input
                                  id={`creche-pai-prof-${secao.id}`}
                                  name="pai_profissao"
                                  placeholder="Profissão"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-pai-emp-${secao.id}`}>
                                Local de emprego do pai
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏢</span>
                                <input
                                  id={`creche-pai-emp-${secao.id}`}
                                  name="pai_local_emprego"
                                  placeholder="Local de emprego"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-row row-parent-address">
                            <div className="form-field">
                              <label htmlFor={`creche-pai-morada-${secao.id}`}>
                                Morada do pai
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏠</span>
                                <input
                                  id={`creche-pai-morada-${secao.id}`}
                                  name="pai_morada"
                                  placeholder="Morada"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-pai-local-${secao.id}`}>
                                Localidade
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏘️</span>
                                <input
                                  id={`creche-pai-local-${secao.id}`}
                                  name="pai_localidade"
                                  placeholder="Localidade"
                                />
                              </div>
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-pai-cp-${secao.id}`}>
                                Código Postal
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">🏷️</span>
                                <input
                                  id={`creche-pai-cp-${secao.id}`}
                                  name="pai_codigo_postal"
                                  placeholder="0000-000"
                                  pattern={POSTAL_PATTERN}
                                  title={POSTAL_TITLE}
                                />
                              </div>
                              {renderFieldError(formKey, "pai_codigo_postal")}
                            </div>
                          </div>
                          <div className="form-row row-parent-contact">
                            <div className="form-field">
                              <label htmlFor={`creche-pai-email-${secao.id}`}>
                                Email
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">✉️</span>
                                <input
                                  id={`creche-pai-email-${secao.id}`}
                                  name="pai_email"
                                  type="email"
                                  placeholder="email@exemplo.pt"
                                />
                              </div>
                              {renderFieldError(formKey, "pai_email")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`creche-pai-tel-${secao.id}`}>
                                Telemóvel
                              </label>
                              <div className="input-with-icon">
                                <span className="input-icon">📱</span>
                                <input
                                  id={`creche-pai-tel-${secao.id}`}
                                  name="pai_telemovel"
                                  placeholder="Telemóvel"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Telemóvel deve ter 9 dígitos"
                                />
                              </div>
                              {renderFieldError(formKey, "pai_telemovel")}
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-field">
                              <fieldset>
                                <legend>
                                  Irmãos a frequentar o estabelecimento?
                                </legend>
                                <div className="radio-group">
                                  <label>
                                    <input
                                      type="radio"
                                      name="irmaos_frequentam"
                                      value="sim"
                                    />{" "}
                                    Sim
                                  </label>
                                  <label>
                                    <input
                                      type="radio"
                                      name="irmaos_frequentam"
                                      value="nao"
                                      defaultChecked
                                    />{" "}
                                    Não
                                  </label>
                                </div>
                              </fieldset>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-field">
                              <fieldset>
                                <legend>
                                  A criança necessita de apoio especial?
                                </legend>
                                <div className="radio-group">
                                  <label>
                                    <input
                                      type="radio"
                                      name="necessita_apoio"
                                      value="sim"
                                      onChange={() => {
                                        const wrap = document.getElementById(
                                          `apoio-wrap-${secao.id}`,
                                        );
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
                                        const wrap = document.getElementById(
                                          `apoio-wrap-${secao.id}`,
                                        );
                                        if (wrap) wrap.style.display = "none";
                                      }}
                                    />
                                    Não
                                  </label>
                                </div>
                              </fieldset>
                            </div>
                          </div>

                          <div
                            id={`apoio-wrap-${secao.id}`}
                            style={{ display: "none" }}
                            className="form-field"
                          >
                            <label htmlFor={`creche-apoio-${secao.id}`}>
                              Se sim, especifique
                            </label>
                            <textarea
                              id={`creche-apoio-${secao.id}`}
                              name="apoio_especificacao"
                              rows="3"
                              placeholder="Descreva o apoio necessário"
                            />
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
                        <h3>
                          {selectedFormLabel || "Formulário Centro de Dia"}
                        </h3>
                        <form
                          className="centro-dia-form"
                          onInput={(e) => {
                            if (e.target?.setCustomValidity) {
                              e.target.setCustomValidity("");
                            }
                            clearFormError(formKey, e.target?.name);
                          }}
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
                              contacto_nome_completo:
                                form.contacto_nome_completo.value,
                              contacto_telefone: form.contacto_telefone.value,
                              contacto_email: form.contacto_email.value,
                              contacto_parentesco:
                                form.contacto_parentesco.value,
                              observacoes: form.observacoes.value,
                              origem_submissao: "site-secao-personalizada",
                              secao_personalizada_id: secao.id,
                              formulario_escolhido:
                                selectedFormLabel || selectedFormType,
                            };

                            const postalInput = form.codigo_postal;
                            const ccInput = form.cc_bi_numero;
                            const nifInput = form.nif;
                            const nissInput = form.niss;
                            const utenteInput = form.numero_utente;
                            const telInput = form.contacto_telefone;

                            if (
                              postalInput?.value &&
                              !isValidPostal(postalInput.value)
                            ) {
                              postalInput.setCustomValidity(
                                "Código postal inválido (0000-000)",
                              );
                            } else if (postalInput) {
                              postalInput.setCustomValidity("");
                            }

                            if (
                              ccInput?.value &&
                              !/^\d{8,9}$/.test(
                                normalizeDigits(ccInput.value),
                              )
                            ) {
                              ccInput.setCustomValidity(
                                "CC/BI deve ter 8 ou 9 dígitos",
                              );
                            } else if (ccInput) {
                              ccInput.setCustomValidity("");
                            }

                            if (
                              nifInput?.value &&
                              !isValidNif(nifInput.value)
                            ) {
                              nifInput.setCustomValidity("NIF inválido");
                            } else if (nifInput) {
                              nifInput.setCustomValidity("");
                            }

                            if (
                              nissInput?.value &&
                              !isValidNiss(nissInput.value)
                            ) {
                              nissInput.setCustomValidity(
                                "NISS deve ter 11 dígitos",
                              );
                            } else if (nissInput) {
                              nissInput.setCustomValidity("");
                            }

                            if (
                              utenteInput?.value &&
                              !isValidUtente(utenteInput.value)
                            ) {
                              utenteInput.setCustomValidity(
                                "Nº utente deve ter 9 dígitos",
                              );
                            } else if (utenteInput) {
                              utenteInput.setCustomValidity("");
                            }

                            if (
                              telInput?.value &&
                              !isValidPhone(telInput.value)
                            ) {
                              telInput.setCustomValidity(
                                "Telefone deve ter 9 dígitos",
                              );
                            } else if (telInput) {
                              telInput.setCustomValidity("");
                            }

                            if (!form.reportValidity()) {
                              return;
                            }

                            setCrecheSelecao((prev) => ({
                              ...prev,
                              [secao.id]:
                                crecheOptionsWithAmbas[0]?.id || "ambas",
                            }));
                            setCrecheNasceuState((prev) => ({
                              ...prev,
                              [secao.id]: undefined,
                            }));
                            try {
                              const resp = await api.post(
                                "/forms/centro-de-dia",
                                data,
                              );
                              if (resp.data?.success) {
                                alert(
                                  "Inscrição Centro de Dia enviada. Entraremos em contacto.",
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
                          <div className="form-row row-name-birth">
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
                              {renderFieldError(formKey, "nome_completo")}
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
                              {renderFieldError(formKey, "data_nascimento")}
                            </div>
                          </div>

                          <div className="form-row row-address">
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
                              {renderFieldError(formKey, "morada_completa")}
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
                              {renderFieldError(formKey, "codigo_postal")}
                            </div>
                          </div>

                          <div className="form-row row-location-2">
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
                              {renderFieldError(formKey, "concelho")}
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
                              {renderFieldError(formKey, "distrito")}
                            </div>
                          </div>

                          <div className="form-row row-id-4">
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
                                  inputMode="numeric"
                                  pattern="[0-9]{8,9}"
                                  title="CC/BI deve ter 8 ou 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "cc_bi_numero")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`nif-${secao.id}`}>NIF</label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`nif-${secao.id}`}
                                  name="nif"
                                  placeholder="NIF"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="NIF deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "nif")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`niss-${secao.id}`}>NISS</label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`niss-${secao.id}`}
                                  name="niss"
                                  placeholder="NISS"
                                  inputMode="numeric"
                                  pattern="[0-9]{11}"
                                  title="NISS deve ter 11 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "niss")}
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
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Nº utente deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "numero_utente")}
                            </div>
                          </div>

                          <div className="form-row row-contact">
                            <div className="form-field">
                              <label
                                htmlFor={`contacto_nome_completo-${secao.id}`}
                              >
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
                              {renderFieldError(formKey, "contacto_nome_completo")}
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
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Telefone deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "contacto_telefone")}
                            </div>
                          </div>

                          <div className="form-row row-contact-2">
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
                              {renderFieldError(formKey, "contacto_email")}
                            </div>
                            <div className="form-field">
                              <label
                                htmlFor={`contacto_parentesco-${secao.id}`}
                              >
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
                              {renderFieldError(formKey, "contacto_parentesco")}
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
                          className="sad-form"
                          onInput={(e) => {
                            if (e.target?.setCustomValidity) {
                              e.target.setCustomValidity("");
                            }
                            clearFormError(formKey, e.target?.name);
                          }}
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
                              contacto_nome_completo:
                                form.contacto_nome_completo.value,
                              contacto_telefone: form.contacto_telefone.value,
                              contacto_email: form.contacto_email.value,
                              contacto_parentesco:
                                form.contacto_parentesco.value,
                              observacoes: form.observacoes.value,
                              higiene_pessoal: form.higiene_pessoal.checked,
                              higiene_habitacional:
                                form.higiene_habitacional.checked,
                              refeicoes: form.refeicoes.checked,
                              tratamento_roupa: form.tratamento_roupa.checked,
                              periodicidade_higiene_pessoal: form
                                .higiene_pessoal.checked
                                ? form.periodicidade_higiene_pessoal.value
                                : "",
                              vezes_higiene_pessoal: form.higiene_pessoal
                                .checked
                                ? form.vezes_higiene_pessoal.value
                                : "",
                              periodicidade_higiene_habitacional: form
                                .higiene_habitacional.checked
                                ? form.periodicidade_higiene_habitacional.value
                                : "",
                              vezes_higiene_habitacional: form
                                .higiene_habitacional.checked
                                ? form.vezes_higiene_habitacional.value
                                : "",
                              periodicidade_refeicoes: form.refeicoes.checked
                                ? form.periodicidade_refeicoes.value
                                : "",
                              vezes_refeicoes: form.refeicoes.checked
                                ? form.vezes_refeicoes.value
                                : "",
                              periodicidade_tratamento_roupa: form
                                .tratamento_roupa.checked
                                ? form.periodicidade_tratamento_roupa.value
                                : "",
                              vezes_tratamento_roupa: form.tratamento_roupa
                                .checked
                                ? form.vezes_tratamento_roupa.value
                                : "",
                              origem_submissao: "site-secao-personalizada",
                              secao_personalizada_id: secao.id,
                              formulario_escolhido:
                                selectedFormLabel || selectedFormType,
                            };

                            const postalInput = form.codigo_postal;
                            const ccInput = form.cc_bi_numero;
                            const nifInput = form.nif;
                            const nissInput = form.niss;
                            const utenteInput = form.numero_utente;
                            const telInput = form.contacto_telefone;

                            if (
                              postalInput?.value &&
                              !isValidPostal(postalInput.value)
                            ) {
                              postalInput.setCustomValidity(
                                "Código postal inválido (0000-000)",
                              );
                            } else if (postalInput) {
                              postalInput.setCustomValidity("");
                            }

                            if (
                              ccInput?.value &&
                              !/^\d{8,9}$/.test(
                                normalizeDigits(ccInput.value),
                              )
                            ) {
                              ccInput.setCustomValidity(
                                "CC/BI deve ter 8 ou 9 dígitos",
                              );
                            } else if (ccInput) {
                              ccInput.setCustomValidity("");
                            }

                            if (
                              nifInput?.value &&
                              !isValidNif(nifInput.value)
                            ) {
                              nifInput.setCustomValidity("NIF inválido");
                            } else if (nifInput) {
                              nifInput.setCustomValidity("");
                            }

                            if (
                              nissInput?.value &&
                              !isValidNiss(nissInput.value)
                            ) {
                              nissInput.setCustomValidity(
                                "NISS deve ter 11 dígitos",
                              );
                            } else if (nissInput) {
                              nissInput.setCustomValidity("");
                            }

                            if (
                              utenteInput?.value &&
                              !isValidUtente(utenteInput.value)
                            ) {
                              utenteInput.setCustomValidity(
                                "Nº utente deve ter 9 dígitos",
                              );
                            } else if (utenteInput) {
                              utenteInput.setCustomValidity("");
                            }

                            if (
                              telInput?.value &&
                              !isValidPhone(telInput.value)
                            ) {
                              telInput.setCustomValidity(
                                "Telefone deve ter 9 dígitos",
                              );
                            } else if (telInput) {
                              telInput.setCustomValidity("");
                            }

                            const periodicidadeHP =
                              form.periodicidade_higiene_pessoal;
                            const vezesHP = form.vezes_higiene_pessoal;
                            const periodicidadeHH =
                              form.periodicidade_higiene_habitacional;
                            const vezesHH = form.vezes_higiene_habitacional;
                            const periodicidadeR = form.periodicidade_refeicoes;
                            const vezesR = form.vezes_refeicoes;
                            const periodicidadeTR =
                              form.periodicidade_tratamento_roupa;
                            const vezesTR = form.vezes_tratamento_roupa;

                            if (data.higiene_pessoal) {
                              if (periodicidadeHP && !periodicidadeHP.value) {
                                periodicidadeHP.setCustomValidity(
                                  "Selecione a periodicidade",
                                );
                              }
                              if (vezesHP && !vezesHP.value) {
                                vezesHP.setCustomValidity(
                                  "Indique as vezes por dia",
                                );
                              }
                            } else {
                              periodicidadeHP?.setCustomValidity("");
                              vezesHP?.setCustomValidity("");
                            }

                            if (data.higiene_habitacional) {
                              if (periodicidadeHH && !periodicidadeHH.value) {
                                periodicidadeHH.setCustomValidity(
                                  "Selecione a periodicidade",
                                );
                              }
                              if (vezesHH && !vezesHH.value) {
                                vezesHH.setCustomValidity(
                                  "Indique as vezes por dia",
                                );
                              }
                            } else {
                              periodicidadeHH?.setCustomValidity("");
                              vezesHH?.setCustomValidity("");
                            }

                            if (data.refeicoes) {
                              if (periodicidadeR && !periodicidadeR.value) {
                                periodicidadeR.setCustomValidity(
                                  "Selecione a periodicidade",
                                );
                              }
                              if (vezesR && !vezesR.value) {
                                vezesR.setCustomValidity(
                                  "Indique as vezes por dia",
                                );
                              }
                            } else {
                              periodicidadeR?.setCustomValidity("");
                              vezesR?.setCustomValidity("");
                            }

                            if (data.tratamento_roupa) {
                              if (periodicidadeTR && !periodicidadeTR.value) {
                                periodicidadeTR.setCustomValidity(
                                  "Selecione a periodicidade",
                                );
                              }
                              if (vezesTR && !vezesTR.value) {
                                vezesTR.setCustomValidity(
                                  "Indique as vezes por dia",
                                );
                              }
                            } else {
                              periodicidadeTR?.setCustomValidity("");
                              vezesTR?.setCustomValidity("");
                            }

                            if (!form.reportValidity()) {
                              return;
                            }

                            try {
                              const resp = await api.post("/forms/sad", data);
                              if (resp.data?.success) {
                                alert(
                                  "Inscrição SAD enviada. Entraremos em contacto.",
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
                          <div className="form-row row-name-birth">
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
                              {renderFieldError(formKey, "nome_completo")}
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
                              {renderFieldError(formKey, "data_nascimento")}
                            </div>
                          </div>

                          <div className="form-row row-address">
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
                              {renderFieldError(formKey, "morada_completa")}
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
                              {renderFieldError(formKey, "codigo_postal")}
                            </div>
                          </div>

                          <div className="form-row row-location-2">
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
                              {renderFieldError(formKey, "concelho")}
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
                              {renderFieldError(formKey, "distrito")}
                            </div>
                          </div>

                          <div className="form-row row-id-4">
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
                                  inputMode="numeric"
                                  pattern="[0-9]{8,9}"
                                  title="CC/BI deve ter 8 ou 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "cc_bi_numero")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`nif-${secao.id}`}>NIF</label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`nif-${secao.id}`}
                                  name="nif"
                                  placeholder="NIF"
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="NIF deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "nif")}
                            </div>
                            <div className="form-field">
                              <label htmlFor={`niss-${secao.id}`}>NISS</label>
                              <div className="input-with-icon">
                                <span className="input-icon">#</span>
                                <input
                                  id={`niss-${secao.id}`}
                                  name="niss"
                                  placeholder="NISS"
                                  inputMode="numeric"
                                  pattern="[0-9]{11}"
                                  title="NISS deve ter 11 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "niss")}
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
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Nº utente deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "numero_utente")}
                            </div>
                          </div>

                          <div className="form-row row-contact">
                            <div className="form-field">
                              <label
                                htmlFor={`contacto_nome_completo-${secao.id}`}
                              >
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
                              {renderFieldError(formKey, "contacto_nome_completo")}
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
                                  inputMode="numeric"
                                  pattern="[0-9]{9}"
                                  title="Telefone deve ter 9 dígitos"
                                  required
                                />
                              </div>
                              {renderFieldError(formKey, "contacto_telefone")}
                            </div>
                          </div>

                          <div className="form-row row-contact-2">
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
                              {renderFieldError(formKey, "contacto_email")}
                            </div>
                            <div className="form-field">
                              <label
                                htmlFor={`contacto_parentesco-${secao.id}`}
                              >
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
                              {renderFieldError(formKey, "contacto_parentesco")}
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
                          <div className="form-row checkbox-row">
                            <div className="form-field checkbox-field">
                              <label>
                                <input
                                  type="checkbox"
                                  name="higiene_pessoal"
                                  id={`higiene_pessoal-${secao.id}`}
                                  onChange={(e) => {
                                    const wrap = document.getElementById(
                                      `wrap-higiene_pessoal-${secao.id}`,
                                    );
                                    if (wrap)
                                      wrap.style.display = e.target.checked
                                        ? "block"
                                        : "none";
                                  }}
                                />
                                Higiene pessoal
                              </label>
                              <div
                                id={`wrap-higiene_pessoal-${secao.id}`}
                                style={{ display: "none" }}
                                className="service-config"
                              >
                                <div className="form-row">
                                  <div className="form-field">
                                    <label
                                      htmlFor={`periodicidade_higiene_pessoal-${secao.id}`}
                                    >
                                      Periodicidade (Higiene pessoal)
                                    </label>
                                    <select
                                      id={`periodicidade_higiene_pessoal-${secao.id}`}
                                      name="periodicidade_higiene_pessoal"
                                      defaultValue=""
                                    >
                                      <option value="">Selecione</option>
                                      <option value="segunda a sexta">
                                        Segunda a sexta
                                      </option>
                                      <option value="segunda a sabado">
                                        Segunda a sábado
                                      </option>
                                      <option value="segunda a domingo">
                                        Segunda a domingo
                                      </option>
                                    </select>
                                    {renderFieldError(
                                      formKey,
                                      "periodicidade_higiene_pessoal",
                                    )}
                                  </div>
                                  <div className="form-field">
                                    <label
                                      htmlFor={`vezes_higiene_pessoal-${secao.id}`}
                                    >
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
                                    {renderFieldError(
                                      formKey,
                                      "vezes_higiene_pessoal",
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="form-field checkbox-field">
                              <label>
                                <input
                                  type="checkbox"
                                  name="higiene_habitacional"
                                  id={`higiene_habitacional-${secao.id}`}
                                  onChange={(e) => {
                                    const wrap = document.getElementById(
                                      `wrap-higiene_habitacional-${secao.id}`,
                                    );
                                    if (wrap)
                                      wrap.style.display = e.target.checked
                                        ? "block"
                                        : "none";
                                  }}
                                />
                                Higiene habitacional
                              </label>
                              <div
                                id={`wrap-higiene_habitacional-${secao.id}`}
                                style={{ display: "none" }}
                                className="service-config"
                              >
                                <div className="form-row">
                                  <div className="form-field">
                                    <label
                                      htmlFor={`periodicidade_higiene_habitacional-${secao.id}`}
                                    >
                                      Periodicidade (Higiene habitacional)
                                    </label>
                                    <select
                                      id={`periodicidade_higiene_habitacional-${secao.id}`}
                                      name="periodicidade_higiene_habitacional"
                                      defaultValue=""
                                    >
                                      <option value="">Selecione</option>
                                      <option value="segunda a sexta">
                                        Segunda a sexta
                                      </option>
                                      <option value="segunda a sabado">
                                        Segunda a sábado
                                      </option>
                                      <option value="segunda a domingo">
                                        Segunda a domingo
                                      </option>
                                    </select>
                                    {renderFieldError(
                                      formKey,
                                      "periodicidade_higiene_habitacional",
                                    )}
                                  </div>
                                  <div className="form-field">
                                    <label
                                      htmlFor={`vezes_higiene_habitacional-${secao.id}`}
                                    >
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
                                    {renderFieldError(
                                      formKey,
                                      "vezes_higiene_habitacional",
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="form-row checkbox-row">
                            <div className="form-field checkbox-field">
                              <label>
                                <input
                                  type="checkbox"
                                  name="refeicoes"
                                  id={`refeicoes-${secao.id}`}
                                  onChange={(e) => {
                                    const wrap = document.getElementById(
                                      `wrap-refeicoes-${secao.id}`,
                                    );
                                    if (wrap)
                                      wrap.style.display = e.target.checked
                                        ? "block"
                                        : "none";
                                  }}
                                />
                                Refeições
                              </label>
                              <div
                                id={`wrap-refeicoes-${secao.id}`}
                                style={{ display: "none" }}
                                className="service-config"
                              >
                                <div className="form-row">
                                  <div className="form-field">
                                    <label
                                      htmlFor={`periodicidade_refeicoes-${secao.id}`}
                                    >
                                      Periodicidade (Refeições)
                                    </label>
                                    <select
                                      id={`periodicidade_refeicoes-${secao.id}`}
                                      name="periodicidade_refeicoes"
                                      defaultValue=""
                                    >
                                      <option value="">Selecione</option>
                                      <option value="segunda a sexta">
                                        Segunda a sexta
                                      </option>
                                      <option value="segunda a sabado">
                                        Segunda a sábado
                                      </option>
                                      <option value="segunda a domingo">
                                        Segunda a domingo
                                      </option>
                                    </select>
                                    {renderFieldError(
                                      formKey,
                                      "periodicidade_refeicoes",
                                    )}
                                  </div>
                                  <div className="form-field">
                                    <label
                                      htmlFor={`vezes_refeicoes-${secao.id}`}
                                    >
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
                                    {renderFieldError(
                                      formKey,
                                      "vezes_refeicoes",
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="form-field checkbox-field">
                              <label>
                                <input
                                  type="checkbox"
                                  name="tratamento_roupa"
                                  id={`tratamento_roupa-${secao.id}`}
                                  onChange={(e) => {
                                    const wrap = document.getElementById(
                                      `wrap-tratamento_roupa-${secao.id}`,
                                    );
                                    if (wrap)
                                      wrap.style.display = e.target.checked
                                        ? "block"
                                        : "none";
                                  }}
                                />
                                Tratamento de roupa
                              </label>
                              <div
                                id={`wrap-tratamento_roupa-${secao.id}`}
                                style={{ display: "none" }}
                                className="service-config"
                              >
                                <div className="form-row">
                                  <div className="form-field">
                                    <label
                                      htmlFor={`periodicidade_tratamento_roupa-${secao.id}`}
                                    >
                                      Periodicidade (Tratamento de roupa)
                                    </label>
                                    <select
                                      id={`periodicidade_tratamento_roupa-${secao.id}`}
                                      name="periodicidade_tratamento_roupa"
                                      defaultValue=""
                                    >
                                      <option value="">Selecione</option>
                                      <option value="segunda a sexta">
                                        Segunda a sexta
                                      </option>
                                      <option value="segunda a sabado">
                                        Segunda a sábado
                                      </option>
                                      <option value="segunda a domingo">
                                        Segunda a domingo
                                      </option>
                                    </select>
                                    {renderFieldError(
                                      formKey,
                                      "periodicidade_tratamento_roupa",
                                    )}
                                  </div>
                                  <div className="form-field">
                                    <label
                                      htmlFor={`vezes_tratamento_roupa-${secao.id}`}
                                    >
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
                                    {renderFieldError(
                                      formKey,
                                      "vezes_tratamento_roupa",
                                    )}
                                  </div>
                                </div>
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
          </div>
        </section>

        {showTranspModal && (
          <div className="edit-modal-overlay">
            <div
              className="edit-modal edit-modal--wide"
              onClick={(e) => e.stopPropagation()}
              ref={transpModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="transp-modal-title"
              onKeyDown={(e) =>
                handleModalKeyDown(e, transpModalRef, () => {
                  setShowTranspModal(false);
                  setTranspEditingDoc(null);
                })
              }
            >
              <div className="edit-modal-header">
                <h3 id="transp-modal-title">
                  {transpEditingDoc
                    ? "Editar documento de transparência"
                    : "Adicionar documento de transparência"}
                </h3>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowTranspModal(false);
                    setTranspEditingDoc(null);
                  }}
                  aria-label="Fechar"
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
                  <label htmlFor="transp-ficheiro">
                    {transpEditingDoc
                      ? "Substituir ficheiro (PDF)"
                      : "Ficheiro PDF *"}
                  </label>
                  <input
                    id="transp-ficheiro"
                    name="ficheiro"
                    type="file"
                    accept="application/pdf"
                    onChange={handleTranspChange}
                    required={!transpEditingDoc}
                  />
                  {transpForm.ficheiro && (
                    <small>Selecionado: {transpForm.ficheiro.name}</small>
                  )}
                  {transpEditingDoc && !transpForm.ficheiro && (
                    <small>Ficheiro atual será mantido.</small>
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
                    {transpSubmitting
                      ? transpEditingDoc
                        ? "A atualizar..."
                        : "A enviar..."
                      : transpEditingDoc
                        ? "Atualizar documento"
                        : "Guardar documento"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmState.open && (
          <div
            className="confirm-modal-overlay"
            onClick={() => handleConfirm(false)}
          >
            <div
              className="confirm-modal"
              onClick={(e) => e.stopPropagation()}
              ref={confirmModalRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-modal-title"
              aria-describedby="confirm-modal-desc"
              onKeyDown={(e) =>
                handleModalKeyDown(e, confirmModalRef, () =>
                  handleConfirm(false),
                )
              }
            >
              <h3 id="confirm-modal-title">Confirmação</h3>
              <p id="confirm-modal-desc">{confirmState.message}</p>
              <div className="confirm-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleConfirm(true)}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-columns">
            <div className="footer-col footer-brand">
              <h3>Centro Paroquial e Social de Lanheses</h3>
              <div className="footer-divider" />
              <p>
                O Centro Paroquial e Social de Lanheses (CPSL) é uma entidade
                emergente e dinâmica que se adapta proativamente às necessidades
                da comunidade. Com um foco primordial nas pessoas, a nossa
                energia vital é alimentada pela atenção, afeto e empenho
                incansável na promoção do bem-estar dos nossos utentes.
              </p>
            </div>
            <div className="footer-col">
              <h4>Contactos</h4>
              <div className="footer-divider" />
              <ul className="footer-list">
                <li>Estrada da Igreja, nº 468 4925-416 Lanheses</li>
                <li>
                  Email:{" "}
                  <a href="mailto:geral@cpslanheses.pt">geral@cpslanheses.pt</a>
                </li>
                <li>
                  Telefone: <a href="tel:258739000">258 739 000</a>
                  <span className="footer-note">
                    {" "}
                    (custo chamada para a rede fixa nacional)
                  </span>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>As Nossas Redes</h4>
              <div className="footer-divider" />
              <div className="footer-social">
                <a
                  href="https://www.facebook.com/profile.php?id=61556284705683"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <span aria-hidden="true">f</span>
                </a>
                <a
                  href="https://www.instagram.com/cpslanheses/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <span aria-hidden="true">ig</span>
                </a>
                <a
                  href="https://www.youtube.com/@CPSLanheses"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                >
                  <span aria-hidden="true">yt</span>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              &copy; {new Date().getFullYear()} Centro Paroquial e Social de
              Lanheses. Todos os direitos reservados.
            </span>
            <a
              className="footer-complaints"
              href="https://www.livroreclamacoes.pt/INICIO/"
              target="_blank"
              rel="noreferrer"
            >
              Livro de Reclamações
            </a>
          </div>
        </div>
      </footer>

      {/* Modal de Edição Inline */}
      {showEditModal && (
        <div className="edit-modal-overlay">
          <div
            className="edit-modal edit-modal--wide"
            onClick={(e) => e.stopPropagation()}
            ref={editModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onKeyDown={(e) =>
              handleModalKeyDown(e, editModalRef, closeEditModal)
            }
          >
            <div className="edit-modal-header">
              <h3 id="edit-modal-title">
                Editar{" "}
                {editingSection === "institucional"
                  ? "Instituição"
                  : editingSection}
              </h3>
              <button
                className="btn-close"
                onClick={closeEditModal}
                aria-label="Fechar"
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
                          <span className="file-button">
                            Escolher ficheiro
                            <input
                              type="file"
                              accept="image/*"
                              className="file-input-hidden"
                              onChange={async (e) => {
                                const f = e.target.files[0];
                                if (f) {
                                  const validation =
                                    await validateImageFile(f);
                                  if (!validation.ok) {
                                    setImageWarning(
                                      "institucional",
                                      validation.message ||
                                        `A imagem deve ter no máximo ${IMAGE_MAX_MB} MB.`,
                                    );
                                    e.target.value = "";
                                    return;
                                  }
                                  clearImageWarning("institucional");
                                  try {
                                    const formData = new FormData();
                                    formData.append("file", f);
                                    formData.append(
                                      "tabela_referencia",
                                      "conteudo_institucional",
                                    );
                                    const response = await api.post(
                                      "/media",
                                      formData,
                                      {
                                        headers: {
                                          "Content-Type": "multipart/form-data",
                                        },
                                      },
                                    );
                                    let url = response.data?.data?.url;
                                    if (url) {
                                      const base =
                                        api.defaults.baseURL?.replace(
                                          /\/api\/?$/,
                                          "",
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
                                    console.error(
                                      "Erro ao enviar imagem:",
                                      err,
                                    );
                                    alert("Erro ao enviar imagem.");
                                  }
                                }
                                e.target.value = "";
                              }}
                            />
                          </span>
                          <small className="hint">
                            Enviar imagem de capa (máx. {IMAGE_MAX_MB} MB)
                          </small>
                          {imageWarnings.institucional && (
                            <div className="file-warning">
                              {imageWarnings.institucional}
                            </div>
                          )}
                          {editingData.imagem && (
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingData({ ...editingData, imagem: "" });
                              }}
                              title="Remover imagem"
                            >
                              Remover imagem
                            </button>
                          )}
                        </div>
                      </div>
                    </label>

                    <label style={{ marginTop: "1rem" }}>
                      <strong>Ou inserir URL da imagem:</strong>
                      <input
                        type="url"
                        value={editingData.imagem || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            imagem: e.target.value,
                          })
                        }
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                      <small className="hint">
                        Cole o endereço completo da imagem (deve começar com
                        http:// ou https://)
                      </small>
                    </label>
                  </div>
                  {renderMediaPicker()}
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
                    <strong>Subtítulo:</strong>
                    <textarea
                      value={editingData.subtitulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          subtitulo: e.target.value,
                        })
                      }
                      rows="2"
                      placeholder="Subtítulo ou resumo breve"
                    />
                  </label>

                  {renderRespostaDestaquesEditor()}

                  <div className="field">
                    <strong>Conteúdo:</strong>
                    <RichTextEditor
                      value={editingData.conteudo || ""}
                      onChange={(value) =>
                        setEditingData({ ...editingData, conteudo: value })
                      }
                    />
                  </div>
                </>
              )}

              {editingSection === "hero" && (
                <>
                  <div className="cover-image-upload">
                    <label>
                      <strong>Imagem de Fundo:</strong>
                      <div className="cover-preview-row">
                        {editingData.imagem_fundo ? (
                          <img
                            src={editingData.imagem_fundo}
                            alt="Fundo"
                            className="cover-preview"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_SVG;
                            }}
                          />
                        ) : (
                          <div className="cover-placeholder">
                            Nenhuma imagem de fundo
                          </div>
                        )}
                        <div className="cover-actions">
                          <span className="file-button">
                            Escolher ficheiro
                            <input
                              type="file"
                              accept="image/*"
                              className="file-input-hidden"
                              onChange={async (e) => {
                                const f = e.target.files[0];
                                if (f) {
                                  const validation =
                                    await validateImageFile(f);
                                  if (!validation.ok) {
                                    setImageWarning(
                                      "hero",
                                      validation.message ||
                                        `A imagem deve ter no máximo ${IMAGE_MAX_MB} MB.`,
                                    );
                                    e.target.value = "";
                                    return;
                                  }
                                  clearImageWarning("hero");
                                  try {
                                    const formData = new FormData();
                                    formData.append("file", f);
                                    formData.append(
                                      "tabela_referencia",
                                      "cpsl_intro",
                                    );
                                    formData.append("id_referencia", 1);
                                    const response = await api.post(
                                      "/media",
                                      formData,
                                      {
                                        headers: {
                                          "Content-Type": "multipart/form-data",
                                        },
                                      },
                                    );
                                    let url = response.data?.data?.url;
                                    if (!url)
                                      throw new Error(
                                        "Upload não retornou URL",
                                      );
                                    const base =
                                      api.defaults.baseURL?.replace(
                                        /\/api\/?$/,
                                        "",
                                      ) || "";
                                    url = url.startsWith("http")
                                      ? url
                                      : `${base}${url}`;
                                    setEditingData({
                                      ...editingData,
                                      imagem_fundo: url,
                                    });
                                  } catch (err) {
                                    console.error(
                                      "Erro ao enviar imagem:",
                                      err,
                                    );
                                    alert("Erro ao enviar imagem.");
                                  }
                                }
                                e.target.value = "";
                              }}
                            />
                          </span>
                          <small className="hint">
                            Enviar imagem de fundo (máx. {IMAGE_MAX_MB} MB)
                          </small>
                          {imageWarnings.hero && (
                            <div className="file-warning">
                              {imageWarnings.hero}
                            </div>
                          )}
                          {editingData.imagem_fundo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingData({
                                  ...editingData,
                                  imagem_fundo: "",
                                });
                              }}
                              className="btn-remove-image"
                            >
                              Remover imagem
                            </button>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>

                  <label>
                    <strong>Ou inserir URL da imagem:</strong>
                    <input
                      type="url"
                      value={editingData.imagem_fundo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          imagem_fundo: e.target.value,
                        })
                      }
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    <small className="hint">
                      Cole o endereço completo da imagem (deve começar com
                      http:// ou https://)
                    </small>
                  </label>

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
                          <span className="file-button">
                            Escolher ficheiro
                            <input
                              type="file"
                              accept="image/*"
                              className="file-input-hidden"
                              onChange={async (e) => {
                                const f = e.target.files[0];
                                if (f) await uploadCoverImage(f);
                                e.target.value = "";
                              }}
                            />
                          </span>
                          <small className="hint">
                            Enviar imagem de capa (máx. {IMAGE_MAX_MB} MB)
                          </small>
                          {imageWarnings.cover && (
                            <div className="file-warning">
                              {imageWarnings.cover}
                            </div>
                          )}
                          {editingData.imagem_destaque && (
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingData({
                                  ...editingData,
                                  imagem_destaque: "",
                                });
                              }}
                              title="Remover imagem"
                            >
                              Remover imagem
                            </button>
                          )}
                        </div>
                      </div>
                    </label>

                    <label style={{ marginTop: "1rem" }}>
                      <strong>Ou inserir URL da imagem:</strong>
                      <input
                        type="url"
                        value={editingData.imagem_destaque || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            imagem_destaque: e.target.value,
                          })
                        }
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                      <small className="hint">
                        Cole o endereço completo da imagem (deve começar com
                        http:// ou https://)
                      </small>
                    </label>
                  </div>
                  {renderMediaPicker()}

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

                  {renderRespostaDestaquesEditor()}

                  <div className="field">
                    <strong>Conteúdo:</strong>
                    <RichTextEditor
                      value={editingData.conteudo || ""}
                      onChange={(value) =>
                        setEditingData({ ...editingData, conteudo: value })
                      }
                    />
                  </div>
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
                          <span className="file-button">
                            Escolher ficheiro
                            <input
                              type="file"
                              accept="image/*"
                              className="file-input-hidden"
                              onChange={async (e) => {
                                const f = e.target.files[0];
                                if (f) await uploadCoverImage(f);
                                e.target.value = "";
                              }}
                            />
                          </span>
                          <small className="hint">
                            Enviar imagem (máx. {IMAGE_MAX_MB} MB)
                          </small>
                          {imageWarnings.cover && (
                            <div className="file-warning">
                              {imageWarnings.cover}
                            </div>
                          )}
                          {editingData.imagem && (
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingData({ ...editingData, imagem: "" });
                              }}
                              title="Remover imagem"
                            >
                              🗑️ Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </label>

                    <label style={{ marginTop: "1rem" }}>
                      <strong>Ou inserir URL da imagem:</strong>
                      <input
                        type="url"
                        value={editingData.imagem || ""}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            imagem: e.target.value,
                          })
                        }
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                      <small className="hint">
                        Cole o endereço completo da imagem (deve começar com
                        http:// ou https://)
                      </small>
                    </label>
                  </div>
                  {renderMediaPicker()}

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
                    <strong>Descrição Breve:</strong>
                    <input
                      type="text"
                      value={editingData.subtitulo || ""}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          subtitulo: e.target.value,
                        })
                      }
                      placeholder="Descrição breve do item"
                    />
                  </label>

                  {renderRespostaDestaquesEditor()}

                  <div className="field">
                    <strong>Conteúdo:</strong>
                    <RichTextEditor
                      value={editingData.conteudo || ""}
                      onChange={(value) =>
                        setEditingData({ ...editingData, conteudo: value })
                      }
                    />
                  </div>

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
            className="edit-modal edit-modal--wide"
            onClick={(e) => e.stopPropagation()}
            ref={newsModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-modal-title"
            onKeyDown={(e) =>
              handleModalKeyDown(e, newsModalRef, closeNewsModal)
            }
          >
            <div className="edit-modal-header">
              <h3 id="news-modal-title">{selectedNews.titulo}</h3>
              <button
                className="btn-close"
                onClick={closeNewsModal}
                aria-label="Fechar"
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

              {/* Galeria */}
              {buildCarouselImages(
                selectedNews.imagem_destaque,
                selectedNews.media || [],
              ).length > 0 && (
                <ImageCarousel
                  images={buildCarouselImages(
                    selectedNews.imagem_destaque,
                    selectedNews.media || [],
                  )}
                  altPrefix={selectedNews.titulo || "Notícia"}
                />
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
                    selectedNews.data_publicacao || selectedNews.created_at,
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
          <div
            className="edit-modal edit-modal--wide"
            onClick={(e) => e.stopPropagation()}
            ref={customItemModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-item-modal-title"
            onKeyDown={(e) =>
              handleModalKeyDown(e, customItemModalRef, () => {
                setShowCustomItemModal(false);
                if (lastFocusedRef.current) {
                  lastFocusedRef.current.focus();
                }
              })
            }
          >
            <div className="edit-modal-header">
              <h3 id="custom-item-modal-title">
                {selectedCustomItem.titulo || "Detalhes"}
              </h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowCustomItemModal(false);
                  if (lastFocusedRef.current) {
                    lastFocusedRef.current.focus();
                  }
                }}
                aria-label="Fechar"
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

              {(() => {
                const destaques = buildRespostaDestaques(
                  selectedCustomItem?.destaques,
                );
                if (!destaques.length) return null;
                return (
                  <div
                    className={`resposta-highlights resposta-highlights--${destaques.length}`}
                    style={{ marginTop: "1rem", marginBottom: "1rem" }}
                  >
                    {destaques.map((item, idx) => (
                      <div
                        key={`modal-destaque-${idx}`}
                        className="resposta-highlight"
                      >
                        {item.titulo && (
                          <div className="resposta-highlight-title">
                            {item.titulo}
                          </div>
                        )}
                        {item.texto && (
                          <div className="resposta-highlight-text">
                            {item.texto}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {selectedCustomItem.conteudo && (
                <div
                  className="custom-item-content"
                  dangerouslySetInnerHTML={{
                    __html: selectedCustomItem.conteudo || "",
                  }}
                />
              )}
              {buildCarouselImages(
                selectedCustomItem.imagem,
                selectedCustomItem.media || [],
              ).length > 0 && (
                <ImageCarousel
                  images={buildCarouselImages(
                    selectedCustomItem.imagem,
                    selectedCustomItem.media || [],
                  )}
                  altPrefix={selectedCustomItem.titulo || "Imagem"}
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
          onClick={() => {
            setSelectedInstitutional(null);
            if (lastFocusedRef.current) {
              lastFocusedRef.current.focus();
            }
          }}
        >
          <div
            className="edit-modal edit-modal--wide"
            onClick={(e) => e.stopPropagation()}
            ref={institutionalModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="institutional-modal-title"
            onKeyDown={(e) =>
              handleModalKeyDown(e, institutionalModalRef, () =>
                setSelectedInstitutional(null),
              )
            }
          >
            <div className="edit-modal-header">
              <h3 id="institutional-modal-title">
                {selectedInstitutional.titulo}
              </h3>
              <button
                className="btn-close"
                onClick={() => {
                  setSelectedInstitutional(null);
                  if (lastFocusedRef.current) {
                    lastFocusedRef.current.focus();
                  }
                }}
                aria-label="Fechar"
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
              {buildCarouselImages(
                selectedInstitutional.imagem,
                selectedInstitutional.media || [],
              ).length > 0 && (
                <ImageCarousel
                  images={buildCarouselImages(
                    selectedInstitutional.imagem,
                    selectedInstitutional.media || [],
                  )}
                  altPrefix={selectedInstitutional.titulo || "Imagem"}
                />
              )}
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
          onClick={() => {
            setSelectedResposta(null);
            if (lastFocusedRef.current) {
              lastFocusedRef.current.focus();
            }
          }}
        >
          <div
            className="edit-modal edit-modal--wide"
            onClick={(e) => e.stopPropagation()}
            ref={respostaModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resposta-modal-title"
            onKeyDown={(e) =>
              handleModalKeyDown(e, respostaModalRef, () =>
                setSelectedResposta(null),
              )
            }
          >
            <div className="edit-modal-header">
              <h3 id="resposta-modal-title">{selectedResposta.titulo}</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setSelectedResposta(null);
                  if (lastFocusedRef.current) {
                    lastFocusedRef.current.focus();
                  }
                }}
                aria-label="Fechar"
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
              {(() => {
                const destaques = buildRespostaDestaques(
                  selectedResposta?.destaques,
                );
                if (!destaques.length) return null;
                return (
                  <div
                    className={`resposta-highlights resposta-highlights--${destaques.length}`}
                  >
                    {destaques.map((item, idx) => (
                      <div
                        key={`resposta-destaque-${idx}`}
                        className="resposta-highlight"
                      >
                        {item.titulo && (
                          <div className="resposta-highlight-title">
                            {item.titulo}
                          </div>
                        )}
                        {item.texto && (
                          <div className="resposta-highlight-text">
                            {item.texto}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div
                className="noticia-conteudo"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedResposta.conteudo ||
                    selectedResposta.descricao ||
                    "",
                }}
              />
              {buildCarouselImages(
                selectedResposta.imagem_destaque,
                selectedResposta.media || [],
              ).length > 0 && (
                <ImageCarousel
                  images={buildCarouselImages(
                    selectedResposta.imagem_destaque,
                    selectedResposta.media || [],
                  )}
                  altPrefix={selectedResposta.titulo || "Imagem"}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Subseção */}
      {showAddModal && (
        <div className="edit-modal-overlay">
          <div
            className="edit-modal edit-modal--wide"
            onClick={(e) => e.stopPropagation()}
            ref={addModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-modal-title"
            onKeyDown={(e) => handleModalKeyDown(e, addModalRef, closeAddModal)}
          >
            <div className="edit-modal-header">
              <h3 id="add-modal-title">
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
                aria-label="Fechar"
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
                            <span className="file-button">
                              Escolher ficheiro
                              <input
                                type="file"
                                accept="image/*"
                                className="file-input-hidden"
                                onChange={async (e) => {
                                  const f = e.target.files[0];
                                  if (f) await uploadCoverImage(f);
                                  e.target.value = "";
                                }}
                              />
                            </span>
                            <small className="hint">
                              Enviar imagem de capa (máx. {IMAGE_MAX_MB} MB)
                            </small>
                            {imageWarnings.cover && (
                              <div className="file-warning">
                                {imageWarnings.cover}
                              </div>
                            )}
                            {(editingSecaoPersonalizada
                              ? editingData.imagem
                              : editingData.imagem_destaque) && (
                              <button
                                type="button"
                                className="btn-remove-image"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (editingSecaoPersonalizada) {
                                    setEditingData({
                                      ...editingData,
                                      imagem: "",
                                    });
                                  } else {
                                    setEditingData({
                                      ...editingData,
                                      imagem_destaque: "",
                                    });
                                  }
                                }}
                                title="Remover imagem"
                              >
                                Remover imagem
                              </button>
                            )}
                          </div>
                        </div>
                      </label>

                      <label style={{ marginTop: "1rem" }}>
                        <strong>Ou inserir URL da imagem:</strong>
                        <input
                          type="url"
                          value={
                            editingSecaoPersonalizada
                              ? editingData.imagem || ""
                              : editingData.imagem_destaque || ""
                          }
                          onChange={(e) => {
                            if (editingSecaoPersonalizada) {
                              setEditingData({
                                ...editingData,
                                imagem: e.target.value,
                              });
                            } else {
                              setEditingData({
                                ...editingData,
                                imagem_destaque: e.target.value,
                              });
                            }
                          }}
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
                        <small className="hint">
                          Cole o endereço completo da imagem (deve começar com
                          http:// ou https://)
                        </small>
                      </label>
                    </div>
                  )}
                {renderMediaPicker()}

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
                          : editingSecaoPersonalizada
                            ? "Descrição Breve:"
                            : "Descrição Breve:"}
                      </strong>
                      <textarea
                        value={
                          editingSection === "respostas-sociais"
                            ? editingData.descricao || ""
                            : editingSecaoPersonalizada
                              ? editingData.subtitulo || ""
                              : editingData.resumo || ""
                        }
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            [editingSection === "respostas-sociais"
                              ? "descricao"
                              : editingSecaoPersonalizada
                                ? "subtitulo"
                                : "resumo"]: e.target.value,
                          })
                        }
                        rows="3"
                        placeholder={
                          editingSection === "noticias"
                            ? "Breve resumo da notícia"
                            : editingSection === "respostas-sociais"
                              ? "Breve descrição da resposta social"
                              : editingSecaoPersonalizada
                                ? "Descrição breve do item"
                                : "Breve descrição"
                        }
                      />
                    </label>
                  )}

                {renderRespostaDestaquesEditor()}

                {/* URL de Vídeo - apenas para seções personalizadas */}
                {editingSecaoPersonalizada && (
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
                )}

                {/* Link Externo - apenas para seções personalizadas */}
                {editingSecaoPersonalizada && (
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
                )}

                {/* Conteúdo com Rich Text Editor - para todas as seções */}
                {editingSection !== "contactos" &&
                  editingSection !== "projetos" && (
                    <div className="field">
                      <strong>Conteúdo:</strong>
                      <RichTextEditor
                        value={editingData.conteudo || ""}
                        onChange={(value) =>
                          setEditingData({ ...editingData, conteudo: value })
                        }
                      />
                    </div>
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
