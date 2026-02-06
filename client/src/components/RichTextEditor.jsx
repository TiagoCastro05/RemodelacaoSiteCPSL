import React, { useRef, useState, useEffect } from "react";
import "../styles/RichTextEditor.css";

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

function RichTextEditor({ value, onChange, api }) {
  const editorRef = useRef(null);
  const isUserTyping = useRef(false);
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const intendedFormatRef = useRef({
    bold: false,
    italic: false,
    underline: false,
  });

  // Sincronizar conteúdo inicial APENAS uma vez
  useEffect(() => {
    if (editorRef.current && !isUserTyping.current) {
      // Só atualizar se o conteúdo do editor for diferente do value externo
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const updateFormatState = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const currentState = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    };

    setFormatState(currentState);
    // Não atualizar intendedFormatRef aqui - isso causava o bug
  };

  const handleClick = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection.rangeCount || selection.isCollapsed === false) return;

      // Forçar o browser a recalcular o estado de formatação
      // Fazemos isso criando um range temporário
      const range = selection.getRangeAt(0).cloneRange();
      const tempNode = document.createTextNode("\u200B"); // Zero-width space
      range.insertNode(tempNode);
      range.selectNode(tempNode);
      selection.removeAllRanges();
      selection.addRange(range);

      // Remover o zero-width space imediatamente
      tempNode.remove();

      // Agora ler o estado limpo
      const currentState = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      };

      setFormatState(currentState);
      intendedFormatRef.current = { ...currentState };
    }, 10);
  };

  const handleKeyUp = () => {
    // Ao usar teclado (setas), atualizar tanto visualização quanto intenção
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const currentState = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    };

    setFormatState(currentState);
    intendedFormatRef.current = currentState;
  };

  const handleInput = () => {
    isUserTyping.current = true;

    // Limpar quaisquer spans vazios ou formatação órfã
    if (editorRef.current) {
      // Remover <b></b>, <i></i>, <u></u> vazios
      editorRef.current
        .querySelectorAll("b:empty, i:empty, u:empty, strong:empty, em:empty")
        .forEach((el) => el.remove());
    }

    updateContent();
    // Apenas atualizar visualização, não a intenção
    setTimeout(() => {
      updateFormatState();
      // Resetar flag após um pequeno delay
      setTimeout(() => {
        isUserTyping.current = false;
      }, 100);
    }, 0);
  };

  const execCommand = (command, value = null) => {
    // Forçar uso de tags HTML em vez de estilos inline
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(command, false, value);
    updateContent();

    // Atualizar estado e intenção após executar comando
    setTimeout(() => {
      const newState = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      };
      setFormatState(newState);
      intendedFormatRef.current = newState;
    }, 0);
  };

  const updateContent = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;

      // Normalizar tags: converter <strong> para <b>
      html = html.replace(/<strong>/gi, "<b>").replace(/<\/strong>/gi, "</b>");
      html = html.replace(/<em>/gi, "<i>").replace(/<\/em>/gi, "</i>");

      // Atualizar o editor se o HTML mudou
      if (editorRef.current.innerHTML !== html) {
        const sel = window.getSelection();
        const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
        const offset = range ? range.startOffset : 0;
        const container = range ? range.startContainer : null;

        editorRef.current.innerHTML = html;

        // Restaurar cursor
        if (container && container.parentNode) {
          try {
            const newRange = document.createRange();
            newRange.setStart(container, offset);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } catch (e) {
            // Ignorar erro de restauração de cursor
          }
        }
      }

      onChange(html);
    }
  };

  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const validation = await validateImageFile(file);
        if (!validation.ok) {
          window.alert(
            validation.message ||
              `A imagem deve ter no máximo ${IMAGE_MAX_MB} MB.`,
          );
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("tabela_referencia", "content_images");

        const response = await api.post("/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        let url = response.data?.data?.url;
        if (url) {
          const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
          url = url.startsWith("http") ? url : `${base}${url}`;
          document.execCommand("insertImage", false, url);
          updateContent();
        }
      } catch (err) {
        console.error("Erro ao enviar imagem:", err);
        alert("Erro ao enviar imagem.");
      }
    };
    input.click();
  };

  const insertLink = () => {
    const url = prompt("Insira o URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          title="Negrito"
          className={`toolbar-btn ${formatState.bold ? "active" : ""}`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          title="Itálico"
          className={`toolbar-btn ${formatState.italic ? "active" : ""}`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          title="Sublinhado"
          className={`toolbar-btn ${formatState.underline ? "active" : ""}`}
        >
          <u>U</u>
        </button>
        <div className="toolbar-separator"></div>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          title="Lista"
          className="toolbar-btn"
        >
          ☰
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          title="Lista Numerada"
          className="toolbar-btn"
        >
          1.
        </button>
        <div className="toolbar-separator"></div>
        <button
          type="button"
          onClick={insertLink}
          title="Inserir Link"
          className="toolbar-btn"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={insertImage}
          title="Inserir Imagem"
          className="toolbar-btn"
        >
          🖼️
        </button>
        <div className="toolbar-separator"></div>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "h2")}
          title="Título 2"
          className="toolbar-btn"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "h3")}
          title="Título 3"
          className="toolbar-btn"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "p")}
          title="Parágrafo"
          className="toolbar-btn"
        >
          P
        </button>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={updateContent}
        onMouseUp={handleClick}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
      ></div>
    </div>
  );
}

export default RichTextEditor;
