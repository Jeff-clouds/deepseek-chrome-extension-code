import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './ui.css';

console.log('UI script is loading...');

const App: React.FC = () => {
  console.log('App component is rendering...');
  
  const onCreate = () => {
    console.log('Button clicked!');
    parent.postMessage({ pluginMessage: { type: 'create-rectangles' } }, '*');
  };

  return (
    <div className="wrapper" style={{ background: 'white', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ color: 'red', fontSize: '24px' }}>TEST TEXT - If you can see this, UI is working!</h1>
      <h2 style={{ color: '#333' }}>Rectangle Creator</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>Click the button below to create rectangles</p>
      <button 
        className="button" 
        onClick={onCreate}
        style={{ 
          backgroundColor: '#18A0FB',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Create Rectangles
      </button>
    </div>
  );
};

console.log('Setting up DOM content loaded listener...');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded event fired');
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }
  
  try {
    console.log('Attempting to render React app...');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering React app:', error);
  }
}); 