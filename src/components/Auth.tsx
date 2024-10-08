import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [availableAuthMethods, setAvailableAuthMethods] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {});
    checkAuthMethods();
    return () => unsubscribe();
  }, []);

  const checkAuthMethods = async () => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, 'test@example.com');
      setAvailableAuthMethods(methods.length > 0 ? methods : ['password']);
    } catch (error) {
      setAvailableAuthMethods(['password']); // Fallback to password auth method only
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: displayName || email });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Add user to Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        name: displayName || userCredential.user.displayName || userCredential.user.email,
        email: userCredential.user.email,
        lastSeen: serverTimestamp(),
        online: true
      }, { merge: true });

    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInAnonymously(auth);
      
      // Add anonymous user to Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        name: 'Anonymous User',
        lastSeen: serverTimestamp(),
        online: true
      }, { merge: true });

    } catch (error: any) {
      setError(getErrorMessage(error));
      // Remove anonymous sign-in from available methods if it fails
      setAvailableAuthMethods(prev => prev.filter(method => method !== 'anonymous'));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'auth/admin-restricted-operation':
        return 'This operation is restricted. Please use email/password sign-in.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      default:
        return `An error occurred: ${error.message}`;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">Welcome to Slack Clone</h1>
        {availableAuthMethods.length === 0 ? (
          <p className="text-red-500 mb-4 text-center">Loading authentication methods...</p>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                required
              />
              {isSignUp && (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-4 text-indigo-500 hover:text-indigo-600"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
            {availableAuthMethods.includes('anonymous') && (
              <button
                onClick={handleAnonymousSignIn}
                disabled={isLoading}
                className={`mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Sign In Anonymously
              </button>
            )}
          </>
        )}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;