import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import '../../Config/Firebase'; // Ensure Firebase is initialized
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const fs = getFirestore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user details from Firestore
      const userDoc = doc(fs, 'users', user.uid);
      const userSnap = await getDoc(userDoc);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.user_status === 'active') {
          if (userData.member_type === 'lawyer') {
            navigate('/lawyer_dashboard');
          } else if (userData.member_type === 'admin') {
            navigate('/admin_dashboard');
          } else {
            setError('Unauthorized user type');
          }
        } else {
          setError('User account is not active');
        }
      } else {
        setError('No such user found');
      }
    } catch (err) {
    //   setError(err.message);
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="left-side">
        <div className="logo-overlay">
          <div className="logo-container">
            <img src={require('../../Assets/img/ibp_logo.png')} alt="IBP Logo" className="logo" />
          </div>
          <h1 className="organization-name">
            Integrated Bar of the Philippines
            <br />
            (IBP - Bulacan Chapter)
          </h1>
        </div>
      </div>
      <div className="right-side">
        <div className="login-box">
          <h2>Welcome!</h2>
          <p>Input your login credentials to start</p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              placeholder='Enter your email address' 
              id="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              placeholder='Enter your password' 
              id="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <div className="forgot-password">
              <a href="/forgot-password">Forgot Password?</a>
            </div>
            <button type="submit">Login</button>
            <p className="signup-link">
              Need tech support? <a href="/signup">Contact here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
