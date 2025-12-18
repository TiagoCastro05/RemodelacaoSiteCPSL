import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import api from "../services/api";
import "../styles/Home.css";

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Definir as secções do site
  const sections = [
    { id: "instituicao", label: "Instituição" },
    { id: "projetos", label: "Projetos" },
    { id: "respostas-sociais", label: "Respostas Sociais" },
    { id: "noticias", label: "Notícias" },
    { id: "contactos", label: "Contactos" },
  ];

  // Buscar projetos da API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await api.get("/projetos");
        // Filtrar apenas projetos ativos
        const activeProjects = (response.data.data || []).filter(
          (project) => project.ativo
        );
        setProjects(activeProjects);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="home-page">
      <Header sections={sections} />

      <section className="hero-section">
        <div className="container">
          <h1>Centro Paroquial e Social de Lanheses</h1>
          <p>
            Dedicando-nos ao apoio social à Pessoas Mais Velhas e à Infância
          </p>
          <a href="#contactos" className="btn-primary">
            Entre em Contacto
          </a>
        </div>
      </section>

      <section id="instituicao" className="section">
        <div className="container">
          <h2>Instituição</h2>
          <p>
            Somos uma Instituição Particular de Solidariedade Social (IPSS)
            reconhecida pelo seu espírito inovador.
          </p>
        </div>
      </section>

      <section id="projetos" className="section">
        <div className="container">
          <h2>Projetos</h2>
          <p className="section-intro">Conheça os nossos projetos em curso.</p>

          {loadingProjects ? (
            <div className="loading-projects">A carregar projetos...</div>
          ) : projects.length === 0 ? (
            <p className="no-projects">Nenhum projeto disponível no momento.</p>
          ) : (
            <div className="projects-list">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-item ${
                    project.url_externa ? "clickable" : ""
                  }`}
                  onClick={() => {
                    if (project.url_externa) {
                      window.open(project.url_externa, "_blank");
                    }
                  }}
                  style={{
                    cursor: project.url_externa ? "pointer" : "default",
                  }}
                >
                  <div className="project-image-container">
                    {project.imagem_destaque ? (
                      <img
                        src={project.imagem_destaque}
                        alt={project.titulo}
                        className="project-image"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/800x400?text=Projeto";
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
                          "pt-PT"
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
          <h2>Respostas Sociais</h2>
          <p>Oferecemos diversos serviços de apoio à comunidade.</p>
        </div>
      </section>

      <section id="noticias" className="section">
        <div className="container">
          <h2>Notícias e Eventos</h2>
          <p>Mantenha-se atualizado com as nossas novidades.</p>
        </div>
      </section>

      <section id="contactos" className="section">
        <div className="container">
          <h2>Contactos</h2>
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
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>
            &copy; 2025 Centro Paroquial e Social de Lanheses. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
