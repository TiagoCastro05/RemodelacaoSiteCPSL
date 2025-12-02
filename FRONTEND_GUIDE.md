# Guia de Implementação - Frontend React

## 📂 Estrutura de Pastas Recomendada

```
client/src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   └── Loader.jsx
│   ├── accessibility/
│   │   ├── AccessibilityMenu.jsx
│   │   ├── FontSizeControl.jsx
│   │   └── ContrastToggle.jsx
│   ├── admin/
│   │   ├── Sidebar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ContentEditor.jsx
│   │   └── MediaUploader.jsx
│   └── home/
│       ├── HeroSection.jsx
│       ├── AboutSection.jsx
│       ├── ProjectsSection.jsx
│       ├── ServicesSection.jsx
│       ├── NewsSection.jsx
│       └── ContactSection.jsx
├── pages/
│   ├── Home.jsx
│   ├── Admin.jsx
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── NotFound.jsx
│   └── admin/
│       ├── UsersManagement.jsx
│       ├── ProjectsManagement.jsx
│       ├── NewsManagement.jsx
│       ├── ServicesManagement.jsx
│       ├── MessagesManagement.jsx
│       └── ContentManagement.jsx
├── contexts/
│   ├── AuthContext.jsx
│   ├── AccessibilityContext.jsx
│   └── ThemeContext.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── projectsService.js
│   ├── newsService.js
│   ├── servicesService.js
│   └── contactService.js
├── hooks/
│   ├── useAuth.js
│   ├── useAccessibility.js
│   └── useScrollSpy.js
├── utils/
│   ├── formatDate.js
│   ├── validateForm.js
│   └── constants.js
├── styles/
│   ├── global.css
│   ├── variables.css
│   ├── accessibility.css
│   └── admin.css
├── App.jsx
└── index.js
```

## 🔧 Dependências a Instalar

```bash
cd client
npm install react-router-dom axios react-icons
```

Opcional (UI/UX):

```bash
npm install framer-motion react-toastify react-modal
```

## 📝 Implementação dos Principais Ficheiros

### 1. services/api.js

```javascript
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/admin";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. contexts/AuthContext.jsx

```javascript
import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. contexts/AccessibilityContext.jsx

```javascript
import React, { createContext, useState, useEffect } from "react";

export const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState("normal");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Carregar preferências do localStorage
    const savedFontSize = localStorage.getItem("fontSize");
    const savedContrast = localStorage.getItem("highContrast");

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedContrast) setHighContrast(savedContrast === "true");
  }, []);

  useEffect(() => {
    // Aplicar classes ao body
    document.body.className = "";
    document.body.classList.add(`font-${fontSize}`);
    if (highContrast) document.body.classList.add("high-contrast");

    // Guardar no localStorage
    localStorage.setItem("fontSize", fontSize);
    localStorage.setItem("highContrast", highContrast);
  }, [fontSize, highContrast]);

  const increaseFontSize = () => {
    const sizes = ["normal", "large", "xlarge"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ["normal", "large", "xlarge"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        highContrast,
        increaseFontSize,
        decreaseFontSize,
        toggleContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
```

### 4. App.jsx

```javascript
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import NotFound from "./pages/NotFound";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AccessibilityProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Login />} />
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AccessibilityProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

### 5. components/PrivateRoute.jsx

```javascript
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>A carregar...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/admin" />;
};

export default PrivateRoute;
```

## 🎨 Estilos de Acessibilidade (styles/accessibility.css)

```css
/* Tamanhos de fonte */
.font-normal {
  font-size: 16px;
}

.font-large {
  font-size: 18px;
}

.font-xlarge {
  font-size: 20px;
}

/* Alto contraste */
.high-contrast {
  background: #000 !important;
  color: #fff !important;
}

.high-contrast a {
  color: #ffff00 !important;
  text-decoration: underline;
}

.high-contrast button {
  background: #fff !important;
  color: #000 !important;
  border: 2px solid #fff !important;
}

/* Foco visível para navegação por teclado */
*:focus {
  outline: 3px solid #ff6b35;
  outline-offset: 2px;
}

/* Skip to content */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: #ff6b35;
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-to-content:focus {
  top: 0;
}
```

## 🔐 Exemplo de Página de Login (pages/Login.jsx)

```javascript
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Login - CPSL Admin</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
```

## 🏠 Estrutura da Página Home (scroll-down)

```javascript
import React from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import AccessibilityMenu from "../components/accessibility/AccessibilityMenu";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import ServicesSection from "../components/home/ServicesSection";
import ProjectsSection from "../components/home/ProjectsSection";
import NewsSection from "../components/home/NewsSection";
import ContactSection from "../components/home/ContactSection";

const Home = () => {
  return (
    <div className="home-page">
      <AccessibilityMenu />
      <Navbar />

      <main>
        <section id="inicio">
          <HeroSection />
        </section>

        <section id="instituicao">
          <AboutSection />
        </section>

        <section id="respostas-sociais">
          <ServicesSection />
        </section>

        <section id="projetos">
          <ProjectsSection />
        </section>

        <section id="noticias">
          <NewsSection />
        </section>

        <section id="contactos">
          <ContactSection />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
```

## ⚙️ Variáveis de Ambiente (.env no client)

Criar ficheiro `client/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 Próximos Passos

1. Implementar os componentes individuais de cada secção
2. Criar formulários de edição no dashboard
3. Implementar upload de imagens com preview
4. Adicionar animações suaves (framer-motion)
5. Implementar notificações (react-toastify)
6. Testes de acessibilidade
7. Otimização de performance
8. Build de produção

## 📚 Recursos Úteis

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axios Documentation](https://axios-http.com)
