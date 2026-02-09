import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../styles/Header.css";
import logo from "../img/logo.png";

// Header com menu, scroll suave e suporte a modo de edicao
const Header = ({ sections = [], customSections = [], isEditMode = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navScrollRef = useRef(null);
  const prevMenuLenRef = useRef(null);
  const location = useLocation();
  const forceArrows = customSections.length >= 3;

  // Seções padrão caso não sejam fornecidas
  const defaultSections = [
    { id: "instituicao", label: "Instituição" },
    { id: "projetos", label: "Projetos" },
    { id: "respostas-sociais", label: "Respostas Sociais" },
    { id: "noticias", label: "Notícias" },
    { id: "transparencia", label: "Transparência" },
    // contacto será reposicionado para o fim abaixo
    { id: "contactos", label: "Contactos" },
  ];

  // Combinar seções padrão com personalizadas (antes dos contactos)
  const secoesPersonalizadasMenu = customSections.map((secao) => ({
    id: secao.slug,
    label: secao.titulo,
  }));

  const baseSections = (
    sections.length > 0 ? sections : defaultSections
  ).filter((s) => s.id !== "contactos");

  const menuSections = [
    ...baseSections,
    ...secoesPersonalizadasMenu,
    { id: "contactos", label: "Contactos" },
  ];

  // Detectar scroll para adicionar efeito ao header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Atualiza estado das setas do menu (scroll horizontal)
  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return undefined;

    if (prevMenuLenRef.current === null) {
      prevMenuLenRef.current = menuSections.length;
    } else if (prevMenuLenRef.current !== menuSections.length) {
      el.scrollLeft = 0;
      prevMenuLenRef.current = menuSections.length;
    }

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
      const hasOverflow = maxScrollLeft > 1;

      if (!hasOverflow) {
        // sem overflow: garantir alinhamento normal
        if (scrollLeft !== 0) el.scrollLeft = 0;
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      if (scrollLeft > maxScrollLeft) el.scrollLeft = maxScrollLeft;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(maxScrollLeft - scrollLeft > 4);
    };

    update();
    const raf = requestAnimationFrame(update);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(update).catch(() => {});
    }
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [menuSections.length, isMobileMenuOpen]);

  const scrollNav = (direction) => {
    const el = navScrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.7);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const handleNavKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNav(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollNav(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      const el = navScrollRef.current;
      if (el) el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      const el = navScrollRef.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }
  };

  const handleNavFocus = (e) => {
    const target = e.target;
    if (target && target.tagName === "A") {
      target.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  };

  // Click em item do menu (scroll suave ou navegacao)
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    // Se estamos no modo de edição (dashboard), não mudar de página
    if (isEditMode || location.pathname.startsWith("/dashboard")) {
      // Scroll suave para a secção dentro da dashboard
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 160; // Admin bar + header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
      return;
    }

    // Se não estamos na home, navegar para lá primeiro
    if (location.pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }

    // Scroll suave para a secção
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Scroll para o topo, respeitando modo de edicao
  const scrollToTop = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    // Se estamos no dashboard, apenas fazer scroll
    if (isEditMode || location.pathname.startsWith("/dashboard")) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    // Se não estamos na home, navegar para lá
    if (location.pathname !== "/") {
      window.location.href = "/";
      return;
    }

    // Se já estamos na home, fazer scroll ao topo
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <header className={`main-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <div className="header-logo">
          <a href="#top" onClick={scrollToTop}>
            <img src={logo} alt="Logo CPSL" className="logo-image" />
            <div className="logo-text">
              <h1>CPSL</h1>
              <span>Centro Paroquial e Social de Lanheses</span>
            </div>
          </a>
        </div>

        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav
          id="main-navigation"
          className={`main-nav ${isMobileMenuOpen ? "mobile-open" : ""}`}
        >
          {(forceArrows || canScrollLeft || canScrollRight) && (
            <button
              type="button"
              className="nav-scroll-btn left"
              onClick={() => scrollNav(-1)}
              aria-label="Scroll menu para a esquerda"
              disabled={!canScrollLeft && !forceArrows}
            >
              ‹
            </button>
          )}
          <div
            className="nav-scroll"
            ref={navScrollRef}
            tabIndex={0}
            onKeyDown={handleNavKeyDown}
            onFocusCapture={handleNavFocus}
            aria-label="Menu de navegação"
          >
            <ul>
              {menuSections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => handleNavClick(e, section.id)}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {(forceArrows || canScrollLeft || canScrollRight) && (
            <button
              type="button"
              className="nav-scroll-btn right"
              onClick={() => scrollNav(1)}
              aria-label="Scroll menu para a direita"
              disabled={!canScrollRight && !forceArrows}
            >
              ›
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
