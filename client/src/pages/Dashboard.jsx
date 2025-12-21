import React, { useContext } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Users from "./Users";
import ProjectsManagement from "./ProjectsManagement";
import ContentManagement from "./ContentManagement";
import Home from "./Home";
import Profile from "./Profile";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
            onClick={() => navigate("/dashboard")}
            className="btn-admin-action"
          >
            🏠 Home
          </button>
          <button
            onClick={() => navigate("/dashboard/projetos")}
            className="btn-admin-action"
          >
            📁 Gerir Projetos
          </button>
          <button
            onClick={() => navigate("/dashboard/conteudo")}
            className="btn-admin-action"
          >
            ✏️ Gerir Conteúdo
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
        <Route path="/conteudo" element={<ContentManagement />} />
        <Route path="/projetos" element={<ProjectsManagement />} />
        <Route path="/perfil" element={<Profile />} />
        {user?.tipo === "Admin" && (
          <Route path="/utilizadores" element={<Users />} />
        )}
      </Routes>
    </div>
  );
};

export default Dashboard;
