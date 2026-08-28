import React from 'react';

export const ContainerNode = ({ section, children, onAction }) => {
  return (
    <div style={{ width: '100%', ...section.style }} onClick={() => section.props.onClick && onAction(section.props.onClick)}>
      {children}
    </div>
  );
};

export const GridNode = ({ section, children, onAction }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: section.props.columns || 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: section.props.gap || '24px',
      ...section.style 
    }}>
      {children}
    </div>
  );
};

export const FlexNode = ({ section, children, onAction }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: section.props.direction || 'row',
      alignItems: section.props.align || 'center',
      justifyContent: section.props.justify || 'flex-start',
      gap: section.props.gap || '16px',
      ...section.style 
    }}>
      {children}
    </div>
  );
};

export const TextNode = ({ section, onAction }) => {
  const Tag = section.props.tag || 'p';
  return (
    <Tag style={{ margin: 0, ...section.style }} dangerouslySetInnerHTML={{ __html: section.props.content || 'Text Element' }} />
  );
};

export const ButtonNode = ({ section, onAction }) => {
  return (
    <button 
      style={{
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        background: 'var(--wb-primary, #0D1B2E)',
        color: '#fff',
        fontWeight: 600,
        ...section.style
      }}
      onClick={(e) => {
        const action = section.props.action || 'scroll';
        if (action) {
          e.preventDefault();
          onAction(action, {
            url: section.props.Url,
            phone: section.props.Phone,
            email: section.props.Email,
            fileUrl: section.props.FileUrl,
            popupId: section.props.PopupId
          });
        }
      }}
    >
      {section.props.text || 'Button'}
    </button>
  );
};

export const ImageNode = ({ section }) => {
  return (
    <img 
      src={section.props.src || 'https://via.placeholder.com/600x400'} 
      alt={section.props.alt || 'Image'} 
      style={{ maxWidth: '100%', height: 'auto', display: 'block', borderRadius: '8px', ...section.style }}
    />
  );
};
