import React from "react";
import Header from "../components/Header";
import "../styles/Home.css";

const Home = () => {
  // Definir as secções do site
  const sections = [
    { id: "instituicao", label: "Instituição" },
    { id: "projetos", label: "Projetos" },
    { id: "respostas-sociais", label: "Respostas Sociais" },
    { id: "noticias", label: "Notícias" },
    { id: "contactos", label: "Contactos" },
  ];

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
          <p>Conheça os nossos projetos em curso.</p>
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
