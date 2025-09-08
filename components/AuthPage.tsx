import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BuildingIcon } from './icons/BuildingIcon';

type View = 'signIn' | 'signUp';

export const AuthPage: React.FC = () => {
  const [view, setView] = useState<View>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'signIn') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { data, error } = await signUp(name, email, password);
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
           setMessage('User already exists. Please sign in.');
           setView('signIn');
        } else {
           setMessage('Success! Please check your email to confirm your account.');
        }
      }
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="text-center mb-6">
            <BuildingIcon className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
            <h1 className="text-3xl font-bold">AI Co-Pilot</h1>
            <p className="text-slate-400">Sign in to continue</p>
        </div>

        <div className="flex border-b border-slate-700 mb-6">
          <button onClick={() => setView('signIn')} className={`flex-1 py-2 font-semibold ${view === 'signIn' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'}`}>Sign In</button>
          <button onClick={() => setView('signUp')} className={`flex-1 py-2 font-semibold ${view === 'signUp' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400'}`}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'signUp' && (
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 p-3 rounded-lg font-semibold hover:bg-indigo-500 disabled:bg-slate-500 transition-colors"
          >
            {loading ? 'Loading...' : (view === 'signIn' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-red-400 text-sm">{error}</p>}
        {message && <p className="mt-4 text-center text-green-400 text-sm">{message}</p>}
      </div>
    </div>
  );
};