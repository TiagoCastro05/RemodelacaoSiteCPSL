// client/src/components/Navbar.js

import React from 'react';
// ===============================================
// CORRIGIDO: O caminho relativo funciona corretamente.
import logo from '../img/logo.png'; 
// ===============================================
import '../styles/Navbar.css'; 

const Navbar = () => {
    return (
        <header className="fixed-navbar">
            <div className="navbar-content"> 
                {/* 1. LOGO: AGORA USANDO O LOGO IMPORTADO */}
                <div className="logo">
                    <img src={logo} alt="Centro Paroquial e Social de Lanheses" />
                </div>
                
                {/* 2. LINKS DE ÂNCORA */}
                <nav className="nav-links">
                    <a href="#instituicao">Instituição</a> 
                    <a href="#projetos">Projetos</a>
                    <a href="#respostas-sociais">Respostas Sociais</a>
                    <a href="#noticias">Notícias e Eventos</a>
                    <a href="#contactos">Contactos</a>
                    
                </nav>
            </div>
        </header>
    );
};

export default Navbar;