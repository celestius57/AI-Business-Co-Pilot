import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleAuthProvider>
        <App />
      </GoogleAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);