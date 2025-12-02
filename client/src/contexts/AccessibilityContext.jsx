import React, { createContext, useState, useEffect } from "react";

export const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState("normal");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    const savedContrast = localStorage.getItem("highContrast");

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedContrast) setHighContrast(savedContrast === "true");
  }, []);

  useEffect(() => {
    document.body.className = "";
    document.body.classList.add(`font-${fontSize}`);
    if (highContrast) document.body.classList.add("high-contrast");

    localStorage.setItem("fontSize", fontSize);
    localStorage.setItem("highContrast", highContrast);
  }, [fontSize, highContrast]);

  const increaseFontSize = () => {
    const sizes = ["normal", "large", "xlarge"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ["normal", "large", "xlarge"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const resetFontSize = () => {
    setFontSize("normal");
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        highContrast,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        toggleContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
