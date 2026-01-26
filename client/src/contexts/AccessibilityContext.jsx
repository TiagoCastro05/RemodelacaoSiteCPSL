import React, { createContext, useState, useEffect } from "react";

export const AccessibilityContext = createContext();

const FONT_SIZES = ["normal", "large", "xlarge", "xxlarge", "xxxlarge"];

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState("normal");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    const savedContrast = localStorage.getItem("highContrast");

    if (savedFontSize && FONT_SIZES.includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }
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
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      setFontSize(FONT_SIZES[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(FONT_SIZES[currentIndex - 1]);
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
