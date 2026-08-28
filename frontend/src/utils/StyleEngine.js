// ─── STYLE ENGINE ─────────────────────────────────────────────────────────────
// Converts JSON style definitions from nodes into injected CSS rules to support
// media queries, hover states, and keyframe animations that inline styles cannot.

const generateCssString = (styleObj) => {
  if (!styleObj) return '';
  return Object.entries(styleObj).map(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `${cssKey}: ${value};`;
  }).join(' ');
};

export const generateNodeStyles = (nodes) => {
  let css = '';

  const processNode = (node) => {
    if (!node) return;
    
    const baseClass = `node-${node.id}`;
    
    // Desktop (Base) styles
    if (node.style && Object.keys(node.style).length > 0) {
      css += `.${baseClass} { ${generateCssString(node.style)} }\n`;
    }

    // Hover styles
    if (node.hoverStyle && Object.keys(node.hoverStyle).length > 0) {
      css += `.${baseClass}:hover { ${generateCssString(node.hoverStyle)} }\n`;
    }

    // Tablet styles (max-width 1024px)
    if (node.tabletStyle && Object.keys(node.tabletStyle).length > 0) {
      css += `@media (max-width: 1024px) {\n  .${baseClass} { ${generateCssString(node.tabletStyle)} }\n}\n`;
    }

    // Mobile styles (max-width 768px)
    if (node.mobileStyle && Object.keys(node.mobileStyle).length > 0) {
      css += `@media (max-width: 768px) {\n  .${baseClass} { ${generateCssString(node.mobileStyle)} }\n}\n`;
    }

    if (node.children) {
      node.children.forEach(processNode);
    }
  };

  nodes.forEach(processNode);
  return css;
};
