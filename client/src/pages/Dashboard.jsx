import React, { useContext } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Users from "./Users";
import ProjectsManagement from "./ProjectsManagement";
import ContentManagement from "./ContentManagement";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>CPSL Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/dashboard/conteudo">Conteúdo Institucional</Link>
          <Link to="/dashboard/projetos">Projetos</Link>
          <Link to="/dashboard/noticias">Notícias</Link>
          <Link to="/dashboard/respostas-sociais">Respostas Sociais</Link>
          <Link to="/dashboard/mensagens">Mensagens</Link>
          <Link to="/dashboard/transparencia">Transparência</Link>
          {user?.tipo === "Admin" && (
            <Link to="/dashboard/utilizadores">Utilizadores</Link>
          )}
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Bem-vindo, {user?.nome}</h1>
          </div>
          <div className="header-right">
            <span className="user-role">{user?.tipo}</span>
            <button onClick={logout} className="btn-logout">
              Sair
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/conteudo" element={<ContentManagement />} />
            <Route path="/projetos" element={<ProjectsManagement />} />
            <Route
              path="/noticias"
              element={
                <div>
                  <h2>Gestão de Notícias</h2>
                  <p>Em construção...</p>
                </div>
              }
            />
            <Route
              path="/respostas-sociais"
              element={
                <div>
                  <h2>Respostas Sociais</h2>
                  <p>Em construção...</p>
                </div>
              }
            />
            <Route
              path="/mensagens"
              element={
                <div>
                  <h2>Mensagens</h2>
                  <p>Em construção...</p>
                </div>
              }
            />
            <Route
              path="/transparencia"
              element={
                <div>
                  <h2>Transparência</h2>
                  <p>Em construção...</p>
                </div>
              }
            />
            {user?.tipo === "Admin" && (
              <Route path="/utilizadores" element={<Users />} />
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
};

const DashboardHome = () => {
  return (
    <div className="dashboard-home">
      <h2>Dashboard</h2>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Projetos</h3>
          <p className="card-number">5</p>
          <p className="card-label">Ativos</p>
        </div>
        <div className="dashboard-card">
          <h3>Notícias</h3>
          <p className="card-number">12</p>
          <p className="card-label">Publicadas</p>
        </div>
        <div className="dashboard-card">
          <h3>Mensagens</h3>
          <p className="card-number">3</p>
          <p className="card-label">Não respondidas</p>
        </div>
      </div>
      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <Link to="/dashboard/noticias" className="btn-primary">
          Nova Notícia
        </Link>
        <Link to="/dashboard/projetos" className="btn-primary">
          Novo Projeto
        </Link>
        <Link to="/dashboard/mensagens" className="btn-primary">
          Ver Mensagens
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
