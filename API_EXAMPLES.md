# Guia de Utilização da API - Exemplos Práticos

## 🔐 Autenticação

### Login

```javascript
import api from "./services/api";

const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    // Guardar token
    localStorage.setItem("token", response.data.token);

    return response.data;
  } catch (error) {
    console.error("Erro no login:", error.response?.data);
    throw error;
  }
};
```

### Obter utilizador autenticado

```javascript
const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.user;
};
```

## 👥 Gestão de Utilizadores (Admin)

### Listar utilizadores

```javascript
const getUsers = async () => {
  const response = await api.get("/users");
  return response.data.data;
};
```

### Criar utilizador

```javascript
const createUser = async (userData) => {
  const response = await api.post("/users", {
    nome: userData.nome,
    email: userData.email,
    password: userData.password,
    tipo: userData.tipo, // 'Admin' ou 'Gestor'
  });
  return response.data;
};
```

### Atualizar utilizador

```javascript
const updateUser = async (id, updates) => {
  const response = await api.put(`/users/${id}`, updates);
  return response.data;
};
```

### Eliminar utilizador

```javascript
const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
```

## 📋 Projetos

### Listar projetos (público)

```javascript
const getProjects = async () => {
  const response = await api.get("/projetos");
  return response.data.data;
};
```

### Obter projeto por ID

```javascript
const getProjectById = async (id) => {
  const response = await api.get(`/projetos/${id}`);
  return response.data.data;
};
```

### Criar projeto

```javascript
const createProject = async (projectData) => {
  const response = await api.post("/projetos", {
    titulo: projectData.titulo,
    descricao: projectData.descricao,
    data_inicio: projectData.data_inicio,
    data_fim: projectData.data_fim || null,
    imagem_destaque: projectData.imagem_destaque,
    ativo: projectData.ativo ?? true,
    ordem: projectData.ordem || 0,
  });
  return response.data;
};
```

### Atualizar projeto

```javascript
const updateProject = async (id, updates) => {
  const response = await api.put(`/projetos/${id}`, updates);
  return response.data;
};
```

### Eliminar projeto

```javascript
const deleteProject = async (id) => {
  const response = await api.delete(`/projetos/${id}`);
  return response.data;
};
```

## 📰 Notícias e Eventos

### Listar notícias (com filtros)

```javascript
const getNews = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.tipo) params.append("tipo", filters.tipo);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.offset) params.append("offset", filters.offset);

  const response = await api.get(`/noticias?${params.toString()}`);
  return response.data.data;
};

// Exemplo de uso:
// getNews({ tipo: 'Natal', limit: 10 })
```

### Obter notícia por ID

```javascript
const getNewsById = async (id) => {
  const response = await api.get(`/noticias/${id}`);
  return response.data.data;
};
```

### Criar notícia

```javascript
const createNews = async (newsData) => {
  const response = await api.post("/noticias", {
    titulo: newsData.titulo,
    resumo: newsData.resumo,
    conteudo: newsData.conteudo,
    tipo: newsData.tipo, // Ex: "Natal", "S. Martinho"
    imagem_destaque: newsData.imagem_destaque,
    publicado: newsData.publicado ?? false,
  });
  return response.data;
};
```

### Atualizar notícia

```javascript
const updateNews = async (id, updates) => {
  const response = await api.put(`/noticias/${id}`, updates);
  return response.data;
};
```

### Eliminar notícia

```javascript
const deleteNews = async (id) => {
  const response = await api.delete(`/noticias/${id}`);
  return response.data;
};
```

## 🏥 Respostas Sociais

### Listar respostas sociais

```javascript
const getSocialServices = async () => {
  const response = await api.get("/respostas-sociais");
  return response.data.data;
};
```

### Obter resposta social por ID

```javascript
const getSocialServiceById = async (id) => {
  const response = await api.get(`/respostas-sociais/${id}`);
  return response.data.data;
};
```

### Criar resposta social

```javascript
const createSocialService = async (serviceData) => {
  const response = await api.post("/respostas-sociais", {
    titulo: serviceData.titulo,
    subtitulo: serviceData.subtitulo,
    descricao: serviceData.descricao,
    objetivos: serviceData.objetivos,
    servicos_prestados: serviceData.servicos_prestados,
    capacidade: serviceData.capacidade,
    horario: serviceData.horario,
    imagem_destaque: serviceData.imagem_destaque,
    ativo: serviceData.ativo ?? true,
    ordem: serviceData.ordem || 0,
  });
  return response.data;
};
```

## 📄 Transparência

### Listar documentos

```javascript
const getTransparencyDocs = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.ano) params.append("ano", filters.ano);
  if (filters.tipo) params.append("tipo", filters.tipo);

  const response = await api.get(`/transparencia?${params.toString()}`);
  return response.data.data;
};
```

### Upload de documento de transparência

```javascript
const uploadTransparencyDoc = async (formData) => {
  const response = await api.post("/transparencia", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Uso:
const handleUpload = async (file, titulo, ano) => {
  const formData = new FormData();
  formData.append("ficheiro", file);
  formData.append("titulo", titulo);
  formData.append("ano", ano);
  formData.append("tipo", "Relatorio_Contas");

  await uploadTransparencyDoc(formData);
};
```

## 📧 Contactos

### Obter contactos institucionais

```javascript
const getContacts = async () => {
  const response = await api.get("/contactos");
  return response.data.data;
};
```

### Enviar formulário de contacto (público)

```javascript
const sendContactForm = async (formData) => {
  const response = await api.post("/contactos/form", {
    nome: formData.nome,
    email: formData.email,
    assunto: formData.assunto,
    mensagem: formData.mensagem,
  });
  return response.data;
};
```

## 💬 Mensagens (Admin/Gestor)

### Listar mensagens

```javascript
const getMessages = async (respondido = null) => {
  let url = "/mensagens";
  if (respondido !== null) {
    url += `?respondido=${respondido}`;
  }

  const response = await api.get(url);
  return response.data.data;
};

// Exemplo:
// getMessages(false) // Apenas não respondidas
// getMessages(true)  // Apenas respondidas
```

### Responder a mensagem

```javascript
const replyToMessage = async (id, resposta) => {
  const response = await api.post(`/mensagens/${id}/responder`, {
    resposta,
  });
  return response.data;
};
```

### Eliminar mensagem

```javascript
const deleteMessage = async (id) => {
  const response = await api.delete(`/mensagens/${id}`);
  return response.data;
};
```

## 🖼 Media

### Obter media associada

```javascript
const getMedia = async (tabela_referencia, id_referencia) => {
  const response = await api.get("/media", {
    params: {
      tabela_referencia,
      id_referencia,
    },
  });
  return response.data.data;
};

// Exemplo:
// getMedia('Projetos', 1) // Media do projeto ID 1
// getMedia('Noticias_Eventos', 5) // Media da notícia ID 5
```

### Upload de media

```javascript
const uploadMedia = async (file, metadata) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("nome", metadata.nome);
  formData.append("tabela_referencia", metadata.tabela_referencia);
  formData.append("id_referencia", metadata.id_referencia);
  formData.append("ordem", metadata.ordem || 0);

  if (metadata.descricao) {
    formData.append("descricao", metadata.descricao);
  }

  const response = await api.post("/media", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
```

### Upload de link externo como media

```javascript
const addExternalMedia = async (metadata) => {
  const response = await api.post("/media", {
    tipo: "link",
    nome: metadata.nome,
    url: metadata.url,
    descricao: metadata.descricao,
    tabela_referencia: metadata.tabela_referencia,
    id_referencia: metadata.id_referencia,
    ordem: metadata.ordem || 0,
  });
  return response.data;
};
```

### Eliminar media

```javascript
const deleteMedia = async (id) => {
  const response = await api.delete(`/media/${id}`);
  return response.data;
};
```

## 📝 Conteúdo Institucional

### Obter conteúdo por secção

```javascript
const getContent = async (secao = null) => {
  let url = "/conteudo";
  if (secao) {
    url += `?secao=${secao}`;
  }

  const response = await api.get(url);
  return response.data.data;
};

// Exemplos de secções:
// 'sobre_nos', 'valores', 'visao_missao', 'compromisso'
```

### Atualizar conteúdo institucional

```javascript
const updateContent = async (id, updates) => {
  const response = await api.put(`/conteudo/${id}`, {
    titulo: updates.titulo,
    subtitulo: updates.subtitulo,
    conteudo: updates.conteudo,
    imagem: updates.imagem,
    video_url: updates.video_url,
    ativo: updates.ativo,
  });
  return response.data;
};
```

## 🎯 Exemplo de Componente React Completo

```javascript
import React, { useState, useEffect } from "react";
import api from "../services/api";

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/projetos");
      setProjects(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja eliminar este projeto?")) {
      try {
        await api.delete(`/projetos/${id}`);
        setProjects(projects.filter((p) => p.id !== id));
      } catch (err) {
        alert("Erro ao eliminar projeto");
      }
    }
  };

  if (loading) return <div>A carregar...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="projects-list">
      <h2>Projetos</h2>
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <h3>{project.titulo}</h3>
          <p>{project.descricao}</p>
          <button onClick={() => handleDelete(project.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
};

export default ProjectsList;
```

## ⚠️ Tratamento de Erros

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Erro com resposta do servidor
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
    return error.response.data.message || "Erro no servidor";
  } else if (error.request) {
    // Erro sem resposta
    console.error("Request:", error.request);
    return "Sem resposta do servidor";
  } else {
    // Erro na configuração
    console.error("Error:", error.message);
    return error.message;
  }
};

// Uso:
try {
  await api.post("/projetos", data);
} catch (error) {
  const errorMessage = handleApiError(error);
  alert(errorMessage);
}
```

## 🔄 Alterar Password

```javascript
const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};
```
