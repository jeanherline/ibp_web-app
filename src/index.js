import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// Import Firebase initialization
import './Config/Firebase';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "./AuthContext"; // Import the AuthProvider
import 'bootstrap/dist/css/bootstrap.min.css';
import 'buffer';
import 'stream-browserify';
import 'crypto-browserify';

import { Buffer } from 'buffer';
window.Buffer = Buffer;


  <link rel="icon" href="%PUBLIC_URL%/ibp_logo.png" />
ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
