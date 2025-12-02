# Guia de Design - CPSL Website

## 🎨 Paleta de Cores

Baseado no protótipo Figma (https://cpslanheses.pt):

### Cores Principais

```css
:root {
  /* Laranja CPSL - Cor primária */
  --primary-color: #ff9966;
  --primary-hover: #ff8547;
  --primary-light: #ffb899;

  /* Azul - Cor secundária */
  --secondary-color: #4a90e2;
  --secondary-hover: #357abd;

  /* Neutros */
  --white: #ffffff;
  --black: #000000;
  --gray-light: #f5f5f5;
  --gray-medium: #cccccc;
  --gray-dark: #666666;

  /* Estados */
  --success: #4caf50;
  --error: #f44336;
  --warning: #ff9800;
  --info: #2196f3;
}
```

### Cores de Fundo

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #ffe9d9; /* Laranja claro */
  --bg-section: #f9f9f9;
  --bg-footer: #333333;
}
```

### Cores de Texto

```css
:root {
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-light: #999999;
  --text-on-primary: #ffffff;
  --text-on-dark: #ffffff;
}
```

## 📝 Tipografia

### Fontes

```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

:root {
  --font-primary: "Poppins", sans-serif;
  --font-secondary: "Arial", sans-serif;
}

body {
  font-family: var(--font-primary);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
}
```

### Tamanhos de Texto

```css
:root {
  /* Headings */
  --h1-size: 48px;
  --h2-size: 36px;
  --h3-size: 28px;
  --h4-size: 24px;
  --h5-size: 20px;
  --h6-size: 18px;

  /* Body */
  --text-base: 16px;
  --text-small: 14px;
  --text-tiny: 12px;

  /* Line Heights */
  --lh-tight: 1.2;
  --lh-normal: 1.6;
  --lh-loose: 1.8;
}

h1 {
  font-size: var(--h1-size);
  font-weight: 700;
  line-height: var(--lh-tight);
  color: var(--primary-color);
}

h2 {
  font-size: var(--h2-size);
  font-weight: 600;
  line-height: var(--lh-tight);
}

h3 {
  font-size: var(--h3-size);
  font-weight: 600;
  line-height: var(--lh-normal);
}
```

### Responsivo

```css
@media (max-width: 768px) {
  :root {
    --h1-size: 32px;
    --h2-size: 28px;
    --h3-size: 24px;
    --h4-size: 20px;
  }
}
```

## 🎯 Espaçamentos

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  --spacing-4xl: 96px;
}

/* Seções */
.section {
  padding: var(--spacing-4xl) 0;
}

@media (max-width: 768px) {
  .section {
    padding: var(--spacing-2xl) 0;
  }
}
```

## 🔲 Componentes

### Botões

```css
.btn {
  display: inline-block;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 153, 102, 0.3);
}

.btn-secondary {
  background: var(--white);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-secondary:hover {
  background: var(--primary-color);
  color: var(--white);
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}
```

### Cards

```css
.card {
  background: var(--white);
  border-radius: 12px;
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: var(--h4-size);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.card-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--lh-normal);
}
```

### Inputs e Forms

```css
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid var(--gray-medium);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 153, 102, 0.1);
}

.form-input::placeholder {
  color: var(--gray-medium);
}

textarea.form-input {
  min-height: 120px;
  resize: vertical;
}
```

## 📐 Layout e Grid

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }
}
```

### Grid System

```css
.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
```

### Flexbox Utilities

```css
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-column {
  flex-direction: column;
}
```

## 🎭 Animações

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}

/* Slide In */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in-left {
  animation: slideInLeft 0.6s ease-out;
}
```

## 🧭 Navbar

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: var(--spacing-md) 0;
  transition: all 0.3s ease;
}

.navbar.scrolled {
  padding: var(--spacing-sm) 0;
  background: rgba(255, 233, 217, 0.95);
  backdrop-filter: blur(10px);
}

.navbar-logo {
  height: 60px;
}

.navbar-menu {
  display: flex;
  gap: var(--spacing-xl);
  list-style: none;
}

.navbar-link {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.navbar-link:hover,
.navbar-link.active {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .navbar-menu {
    flex-direction: column;
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background: var(--white);
    padding: var(--spacing-lg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .navbar-menu.open {
    transform: translateX(0);
  }
}
```

## 👣 Footer

```css
.footer {
  background: var(--bg-footer);
  color: var(--text-on-dark);
  padding: var(--spacing-3xl) 0 var(--spacing-lg);
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
}

.footer-section h3 {
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
}

.footer-link {
  color: var(--text-on-dark);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: var(--primary-color);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--spacing-lg);
  text-align: center;
  font-size: var(--text-small);
  color: var(--gray-medium);
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}
```

## ♿ Acessibilidade

### Foco Visível

```css
*:focus {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

button:focus,
a:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}
```

### Skip to Content

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: var(--primary-color);
  color: var(--white);
  padding: var(--spacing-sm) var(--spacing-md);
  text-decoration: none;
  z-index: 10000;
}

.skip-link:focus {
  top: 0;
}
```

### Alto Contraste

```css
.high-contrast {
  --primary-color: #ff6600;
  --text-primary: #000000;
  --text-secondary: #000000;
  --bg-primary: #ffffff;
  --bg-secondary: #ffff00;
}

.high-contrast a {
  text-decoration: underline;
  font-weight: 600;
}
```

## 📱 Breakpoints

```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --breakpoint-2xl: 1400px;
}

/* Uso */
@media (min-width: 768px) {
  /* Tablet e acima */
}

@media (min-width: 992px) {
  /* Desktop e acima */
}
```

## 🎨 Exemplo de Seção Completa

```css
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--white) 100%
  );
  padding: var(--spacing-4xl) 0;
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  animation: fadeIn 1s ease-out;
}

.hero-subtitle {
  font-size: 24px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  animation: fadeIn 1s ease-out 0.2s backwards;
}

.hero-cta {
  animation: fadeIn 1s ease-out 0.4s backwards;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }
}
```

## 🖼 Imagens

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
}

.img-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-contain {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.img-rounded {
  border-radius: 8px;
}

.img-circle {
  border-radius: 50%;
}
```

## 💡 Dicas de Implementação

1. **Usar variáveis CSS** para facilitar alterações de cores/espaçamentos
2. **Mobile First** - começar pelo design mobile e expandir para desktop
3. **Consistência** - usar os mesmos espaçamentos e cores em todo o site
4. **Performance** - otimizar imagens antes de fazer upload
5. **Acessibilidade** - sempre incluir alt text em imagens
6. **Semântica** - usar tags HTML5 apropriadas (section, article, nav, etc.)
