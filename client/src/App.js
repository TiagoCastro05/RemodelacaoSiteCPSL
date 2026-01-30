// client/src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import AccessibilityBar from "./components/AccessibilityBar";
import ScrollTopButton from "./components/ScrollTopButton";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AccessibilityProvider>
          <a href="#conteudo" className="skip-link">
            Saltar para conteúdo
          </a>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4500,
              style: {
                background: "#0f172a",
                color: "#fff",
                padding: "14px 18px",
                fontSize: "1rem",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.35)",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#0f172a",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#0f172a",
                },
              },
            }}
          />
          <AccessibilityBar />
          <ScrollTopButton />
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
