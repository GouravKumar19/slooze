"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    country: {
        id: string;
        name: string;
        code: string;
    };
}

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/auth/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error('Failed to fetch users:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId) {
            setError('Please select a user');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.token, data.user);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'badge-admin';
            case 'MANAGER':
                return 'badge-manager';
            default:
                return 'badge-member';
        }
    };

    const getCountryFlag = (code: string) => {
        return code === 'IN' ? '🇮🇳' : '🇺🇸';
    };

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4">
                        <span className="text-3xl">🍔</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                        FoodHub
                    </h1>
                    <p className="text-dark-400 mt-2">Team Food Ordering Platform</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-6 text-center">
                        Select Your Account
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            {isLoading ? (
                                <div className="h-12 bg-dark-800 rounded-xl animate-pulse"></div>
                            ) : (
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="input cursor-pointer"
                                >
                                    <option value="">Choose a user...</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {getCountryFlag(user.country.code)} {user.name} - {user.role} ({user.country.name})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedUserId}
                            className="btn-primary w-full"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Signing in...
                                </span>
                            ) : (
                                'Continue as Selected User'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-dark-400 text-sm mt-4">
                        Demo mode: Select a user to login without password
                    </p>
                </div>

                {/* Role Info */}
                <div className="glass rounded-2xl p-6 mt-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Role Permissions</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="badge badge-admin">ADMIN</span>
                            <span className="text-dark-400">All access + Payment management</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="badge badge-manager">MANAGER</span>
                            <span className="text-dark-400">View, Order, Checkout, Cancel (own country)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="badge badge-member">MEMBER</span>
                            <span className="text-dark-400">View restaurants, Add items to cart only</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
