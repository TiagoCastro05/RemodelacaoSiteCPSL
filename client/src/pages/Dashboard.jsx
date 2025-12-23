import React, { useContext, useState, useEffect } from "react";
import api from "../services/api";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Users from "./Users";
import ProjectsManagement from "./ProjectsManagement";
import Home from "./Home";
import Profile from "./Profile";
import Messages from "./Messages";
import CustomSectionsManagement from "./CustomSectionsManagement";
import SectionItemsManagement from "./SectionItemsManagement";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const resp = await api.get("/mensagens?respondido=false");
        if (resp.data && resp.data.success)
          setUnread((resp.data.data || []).length);
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
    // listen to messages updates from Messages component
    const handler = (e) => {
      if (e && e.detail && typeof e.detail.unread === "number")
        setUnread(e.detail.unread);
    };
    const handlerServer = (e) => {
      if (e && e.detail && typeof e.detail.unread === "number")
        setUnread(e.detail.unread);
    };
    window.addEventListener("mensagens:updated", handler);
    window.addEventListener("mensagens:server", handlerServer);

    // also refetch when window/tab becomes visible to ensure accurate badge after background changes
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("mensagens:updated", handler);
      window.removeEventListener("mensagens:server", handlerServer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className="dashboard">
      {/* Barra de admin fixa no topo */}
      <div className="admin-bar">
        <div className="admin-bar-left">
          <span className="admin-logo">🔧 CPSL Admin</span>
          <span className="admin-user">
            {user?.nome} ({user?.tipo})
          </span>
        </div>
        <div className="admin-bar-right">
          <button
            onClick={() => navigate("/dashboard/projetos")}
            className="btn-admin-action"
          >
            📁 Gerir Projetos
          </button>
          <button
            onClick={() => navigate("/dashboard/secoes")}
            className="btn-admin-action"
          >
            ➕ Secções Personalizadas
          </button>
          <button
            onClick={() => navigate("/dashboard/mensagens")}
            className="btn-admin-action"
            title="Mensagens"
          >
            ✉️ Mensagens{" "}
            {unread > 0 && <span className="badge-dot" aria-hidden="true" />}
          </button>
          {user?.tipo === "Admin" && (
            <button
              onClick={() => navigate("/dashboard/utilizadores")}
              className="btn-admin-action"
            >
              👥 Utilizadores
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard/perfil")}
            className="btn-admin-action"
          >
            👤 Perfil
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <Routes>
        {/* Dashboard principal agora mostra o site público com edição inline */}
        <Route path="/" element={<Home isEditMode={true} />} />
        <Route path="/mensagens" element={<Messages />} />
        <Route path="/projetos" element={<ProjectsManagement />} />
        <Route path="/secoes" element={<CustomSectionsManagement />} />
        <Route
          path="/secoes/:secaoId/itens"
          element={<SectionItemsManagement />}
        />
        <Route path="/perfil" element={<Profile />} />
        {user?.tipo === "Admin" && (
          <Route path="/utilizadores" element={<Users />} />
        )}
      </Routes>
    </div>
  );
};

export default Dashboard;
