import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";
import "../styles/Profile.css";

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    senha: "",
    tipo: "Gestor",
  });
  const [loading, setLoading] = useState(true);

  // Carregar lista de utilizadores (apenas Admin)
  useEffect(() => {
    if (user?.tipo === "Admin") {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", newUser);
      alert("Utilizador criado com sucesso!");
      setShowAddModal(false);
      setNewUser({ nome: "", email: "", senha: "", tipo: "Gestor" });
      fetchUsers();
    } catch (error) {
      console.error("Erro ao criar utilizador:", error);
      alert("Erro ao criar utilizador. Verifique os dados.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja eliminar este utilizador?")) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      alert("Utilizador eliminado com sucesso!");
      fetchUsers();
    } catch (error) {
      console.error("Erro ao eliminar utilizador:", error);
      alert("Erro ao eliminar utilizador.");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}/toggle-status`);
      alert(
        `Utilizador ${currentStatus ? "desativado" : "ativado"} com sucesso!`
      );
      fetchUsers();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status do utilizador.");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Informações do Utilizador Atual */}
        <section className="profile-info">
          <h1>Perfil</h1>
          <div className="profile-card">
            <div className="profile-item">
              <strong>Nome:</strong> <span>{user?.nome || "(Nome)"}</span>
            </div>
            <div className="profile-item">
              <strong>Email:</strong> <span>{user?.email || "(email)"}</span>
            </div>
            <div className="profile-item">
              <strong>Tipo Conta:</strong>{" "}
              <span className={`badge badge-${user?.tipo?.toLowerCase()}`}>
                {user?.tipo}
              </span>
            </div>
          </div>
          <button onClick={logout} className="btn-logout">
            Terminar Sessão
          </button>
        </section>

        {/* Gestão de Contas (apenas Admin) */}
        {user?.tipo === "Admin" && (
          <section className="accounts-management">
            <div className="section-header">
              <h2>Contas</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-add-account"
              >
                Adicionar Conta
              </button>
            </div>

            {loading ? (
              <p>A carregar utilizadores...</p>
            ) : (
              <div className="accounts-table">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo conta</th>
                      <th>Email</th>
                      <th>Nome</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={!u.ativo ? "inactive" : ""}>
                        <td>
                          <span
                            className={`badge badge-${u.tipo?.toLowerCase()}`}
                          >
                            {u.tipo}
                          </span>
                        </td>
                        <td>{u.email || "(Email)"}</td>
                        <td>{u.nome || "(Nome)"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleToggleStatus(u.id, u.ativo)}
                              className="btn-toggle"
                              title={u.ativo ? "Desativar" : "Ativar"}
                            >
                              {u.ativo ? "🔓" : "🔒"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn-delete"
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
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal Adicionar Conta */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Conta</h3>
              <button
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <label>
                  <strong>Nome:</strong>
                  <input
                    type="text"
                    value={newUser.nome}
                    onChange={(e) =>
                      setNewUser({ ...newUser, nome: e.target.value })
                    }
                    required
                    placeholder="Nome completo"
                  />
                </label>
                <label>
                  <strong>Email:</strong>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                    placeholder="email@exemplo.com"
                  />
                </label>
                <label>
                  <strong>Senha:</strong>
                  <input
                    type="password"
                    value={newUser.senha}
                    onChange={(e) =>
                      setNewUser({ ...newUser, senha: e.target.value })
                    }
                    required
                    placeholder="Senha forte"
                  />
                </label>
                <label>
                  <strong>Tipo:</strong>
                  <select
                    value={newUser.tipo}
                    onChange={(e) =>
                      setNewUser({ ...newUser, tipo: e.target.value })
                    }
                  >
                    <option value="Gestor">Gestor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
