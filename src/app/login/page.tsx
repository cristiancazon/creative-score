'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { directus } from '@/lib/directus';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Standard login signature expecting object
            // @ts-ignore
            const loginResult = await directus.login({ email, password });
            console.log("Login Result:", loginResult);

            // Manual setToken is not needed as login handles storage
            // But we keep the check to ensure success
            if (!loginResult || !loginResult.access_token) {
                throw new Error("Login failed - no token received");
            }

            // Check token immediately after
            const token = await directus.getToken();
            console.log("Token after login:", token);

            router.push('/admin');
        } catch (err: any) {
            console.error("Login Error:", err);
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
                <div className="flex justify-center mb-6">
                    <div className="relative w-full h-24">
                        <Image
                            src="/logo_cs.png"
                            alt="Creative Score"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>


                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
