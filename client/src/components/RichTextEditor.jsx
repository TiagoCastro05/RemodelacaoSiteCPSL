import React, { useState, useRef } from "react";
import "../styles/RichTextEditor.css";

function RichTextEditor({ value, onChange, api }) {
  const editorRef = useRef(null);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
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
          className="toolbar-btn"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          title="Itálico"
          className="toolbar-btn"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          title="Sublinhado"
          className="toolbar-btn"
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
        dangerouslySetInnerHTML={{ __html: value || "" }}
        onInput={updateContent}
        onBlur={updateContent}
      ></div>
    </div>
  );
}

export default RichTextEditor;
