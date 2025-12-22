// client/src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import Home from "./pages/Home";
import Navbar from "./components/Navbar"; // <-- JÁ ESTÁ IMPORTADO CORRETAMENTE
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import "./styles/global.css";

function App() {
  return (
    <Router>
      {/* ============================================================== */}
      {/* 1. RENDERIZAR O NAVBAR AQUI, ACIMA DO RESTO DO CONTEÚDO */}
      <Navbar /> 
      {/* ============================================================== */}
      <AuthProvider>
        <AccessibilityProvider>
          <Routes>
            {/* 2. O Home irá renderizar as secções âncora */}
            <Route path="/" element={<Home />} /> 
            <Route path="/admin" element={<Login />} />
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </AccessibilityProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;