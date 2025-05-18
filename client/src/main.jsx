import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter
import App from './App.jsx';
import './index.css'; // Import Tailwind CSS styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap the App component with Router */}
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
