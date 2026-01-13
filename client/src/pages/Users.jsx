import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Users.css";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    tipo: "Gestor",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [sortOrder, setSortOrder] = useState("recentes");

  // Carregar utilizadores
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
      setError("Erro ao carregar utilizadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Manipular mudanças no formulário
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Criar novo utilizador
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validação
    if (!formData.nome || !formData.email || !formData.password) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (formData.password.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const response = await api.post("/users", formData);

      if (response.data.success) {
        setSuccess("Utilizador criado com sucesso!");
        setFormData({
          nome: "",
          email: "",
          password: "",
          tipo: "Gestor",
        });
        fetchUsers();
        setTimeout(() => {
          setShowModal(false);
          setSuccess("");
        }, 2000);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao criar utilizador. Tente novamente.";
      setError(message);
    }
  };

  // Alternar estado ativo/inativo
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/users/${userId}/toggle-status`);

      if (response.data.success) {
        setSuccess(
          `Utilizador ${currentStatus ? "desativado" : "ativado"} com sucesso!`
        );
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError("Erro ao alterar estado do utilizador.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Filtrar e ordenar utilizadores
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "todos" || user.tipo === filterType;
      const matchesStatus =
        filterStatus === "todos" ||
        (filterStatus === "ativos" && user.ativo) ||
        (filterStatus === "inativos" && !user.ativo);
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "recentes") {
        return new Date(b.data_criacao) - new Date(a.data_criacao);
      } else if (sortOrder === "antigos") {
        return new Date(a.data_criacao) - new Date(b.data_criacao);
      } else if (sortOrder === "nome") {
        return (a.nome || "").localeCompare(b.nome || "");
      }
      return 0;
    });

  // Eliminar utilizador
  const deleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja eliminar este utilizador?")) {
      return;
    }

    try {
      const response = await api.delete(`/users/${userId}`);

      if (response.data.success) {
        setSuccess("Utilizador eliminado com sucesso!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao eliminar utilizador. Tente novamente.";
      setError(message);
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>Gestão de Utilizadores ({filteredUsers.length})</h2>
        <div className="dashboard-actions">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Voltar
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Novo Utilizador
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="todos">Todos os tipos</option>
            <option value="Admin">Admin</option>
            <option value="Gestor">Gestor</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos os estados</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="nome">Nome A-Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">A carregar...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Data de Criação</th>
                <th>Criado Por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.tipo.toLowerCase()}`}>
                      {user.tipo}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.ativo ? "status-active" : "status-inactive"
                      }`}
                    >
                      {user.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{new Date(user.data_criacao).toLocaleDateString()}</td>
                  <td>{user.criado_por_nome || "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-toggle"
                        onClick={() => toggleUserStatus(user.id, user.ativo)}
                        title={user.ativo ? "Desativar" : "Ativar"}
                      >
                        {user.ativo ? "🔒" : "🔓"}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => deleteUser(user.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-data">Nenhum utilizador encontrado.</div>
          )}
        </div>
      )}

      {/* Modal para criar utilizador */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Novo Utilizador</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.pt"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo">Tipo de Utilizador</label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="Gestor">Gestor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
