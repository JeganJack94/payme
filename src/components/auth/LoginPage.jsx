import { useState, useEffect } from 'react';
import { signInWithRedirect, setPersistence, browserLocalPersistence, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [user, loading] = useAuthState(auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    } else if (location.pathname !== '/login') {
      // Only navigate to /login if not already on the login page
      navigate('/login');
    }
  }, [user, navigate, location.pathname]);

  useEffect(() => {
    let wasAuthenticated = false; // Track if the user was previously authenticated

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        wasAuthenticated = true; // User is authenticated
      } else if (wasAuthenticated) {
        // Only show the alert if the user was previously authenticated
        alert('Session expired. Please sign in again.');
        navigate('/login');
      }
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, [navigate]);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please fill in both email and password fields.');
      return;
    }

    try {
      setSigningIn(true);
      await setPersistence(auth, browserLocalPersistence); // Set long session persistence
      await signInWithEmailAndPassword(auth, email, password); // Use email/password sign-in
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (error) {
      console.error('Sign-in error:', error);
      alert(
        error.code === 'auth/wrong-password'
          ? 'Incorrect password. Please try again.'
          : error.code === 'auth/user-not-found'
          ? 'No user found with this email. Please sign up first.'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email format. Please check your email.'
          : 'Error signing in. Please try again.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in with your email and password</p>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#e82c2a] focus:border-[#e82c2a]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#e82c2a] focus:border-[#e82c2a]"
            />
          </div>
          <button
            type="submit"
            disabled={signingIn}
            className="w-full bg-[#e82c2a] text-white py-3 rounded-lg font-semibold
                     hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#e82c2a] focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-[#e82c2a] font-medium hover:underline">
              Sign up
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Forgot your password?{' '}
            <a href="/forgot-password" className="text-[#e82c2a] font-medium hover:underline">
              Reset it here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
