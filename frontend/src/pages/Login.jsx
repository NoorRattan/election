import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';

export default function Login() {
  const { signInWithGoogle, signInWithEmail, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { document.title = 'Sign In | Electra'; }, []);
  useEffect(() => { if (user) navigate(redirectTo, { replace: true }); }, [user, navigate, redirectTo]);

  async function handleGoogle() {
    setLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch (e) { setError(e.message || 'Google sign-in failed.'); setLoading(false); }
  }

  async function handleEmailSignIn(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await signInWithEmail(email, password); }
    catch (e) { setError(e.message || 'Sign-in failed. Check your email and password.'); setLoading(false); }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-neutral-900 text-center mb-8">Sign in to Electra</h1>

        {/* Google sign-in */}
        <Button variant="secondary" loading={loading} onClick={handleGoogle} className="w-full mb-4" ariaLabel="Sign in with Google">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"/></div>
          <div className="relative text-center"><span className="bg-neutral-50 px-3 text-xs text-neutral-400">or</span></div>
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-2 focus:outline-primary-600"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-2 focus:outline-primary-600"
            />
          </div>

          {error && (
            <p role="alert" aria-live="assertive" className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full">Sign In</Button>
        </form>

        <p className="text-xs text-neutral-500 text-center mt-6">
          By signing in you agree to our <Link to="/privacy" className="text-neutral-600 underline hover:text-neutral-900 focus:outline-2 focus:outline-primary-600 rounded">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
