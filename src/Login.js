import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError('Failed to sign in with Google.');
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>AI Investment Analyst</h2>
        <p>Please sign in to continue</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Sign In</button>
        </form>
        <div className="divider">or</div>
        <button onClick={handleGoogleSignIn} className="google-btn">
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
