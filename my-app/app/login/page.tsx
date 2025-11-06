'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// If already signed in, go home
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) router.replace('/');
		});
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}
		router.replace('/');
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
			<div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
				<h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Welcome back Habibi - very nice to see you 🫶</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Please sign in to get priced 💰</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">E-Mail</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
						/>
					</div>
					<div>
						<label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Passwort</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
						/>
					</div>

					{error && (
						<div className="text-sm text-red-600 dark:text-red-400">{error}</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full py-2.5 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
					>
						{loading ? 'Signing in…' : 'Sign In'}
					</button>
				</form>

				<p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
					To sign-up, please contact your account manager.
				</p>
			</div>
		</div>
	);
}


