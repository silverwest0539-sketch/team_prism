import React, { useEffect, useState } from 'react';

const isDarkMode = () => {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('theme-dark');
};

const BrandLogo = ({
  text = 'PicKey',
  imageSrc = '/PicKeyLogo.svg',
  darkImageSrc = '/PicKeyLogo_lightblue.svg',
  imageHeightClass = 'h-10',
  imageClassName = '',
  textClassName = 'text-4xl font-bold',
}) => {
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    const syncTheme = () => setDarkMode(root.classList.contains('theme-dark'));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (darkMode && !darkImageSrc) {
    return <span className={textClassName}>{text}</span>;
  }

  return (
    <img
      src={darkMode ? darkImageSrc : imageSrc}
      alt={text}
      className={`${imageHeightClass} w-auto ${imageClassName}`.trim()}
    />
  );
};

export default BrandLogo;
