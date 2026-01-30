"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface PaymentMethod {
    id: string;
    type: string;
    lastFour: string;
    isDefault: boolean;
}

export default function SettingsPage() {
    const router = useRouter();
    const { token, user, hasPermission } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New payment method form
    const [showForm, setShowForm] = useState(false);
    const [newType, setNewType] = useState('CREDIT_CARD');
    const [newLastFour, setNewLastFour] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!hasPermission('UPDATE_PAYMENT_METHOD')) {
            router.push('/dashboard');
            return;
        }
        fetchPaymentMethods();
    }, [token, hasPermission, router]);

    const fetchPaymentMethods = async () => {
        if (!token) return;

        try {
            const response = await fetch('/api/payment-methods', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setPaymentMethods(data);
            }
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newLastFour.length !== 4 || !/^\d+$/.test(newLastFour)) {
            setError('Please enter exactly 4 digits');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/payment-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: newType,
                    lastFour: newLastFour,
                    isDefault: paymentMethods.length === 0,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to add payment method');
            }

            setSuccess('Payment method added successfully');
            setTimeout(() => setSuccess(''), 3000);
            setShowForm(false);
            setNewLastFour('');
            fetchPaymentMethods();
        } catch (err: any) {
            setError(err.message || 'Failed to add payment method');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const response = await fetch('/api/payment-methods', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id, isDefault: true }),
            });

            if (!response.ok) {
                throw new Error('Failed to update payment method');
            }

            setSuccess('Default payment method updated');
            setTimeout(() => setSuccess(''), 3000);
            fetchPaymentMethods();
        } catch (err) {
            setError('Failed to update payment method');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) return;

        try {
            const response = await fetch(`/api/payment-methods?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to delete payment method');
            }

            setSuccess('Payment method deleted');
            setTimeout(() => setSuccess(''), 3000);
            fetchPaymentMethods();
        } catch (err) {
            setError('Failed to delete payment method');
        }
    };

    const getCardIcon = (type: string) => {
        switch (type) {
            case 'CREDIT_CARD':
                return '💳';
            case 'DEBIT_CARD':
                return '💳';
            case 'UPI':
                return '📱';
            case 'PAYPAL':
                return '🅿️';
            default:
                return '💰';
        }
    };

    if (!hasPermission('UPDATE_PAYMENT_METHOD')) {
        return null;
    }

    return (
        <div className="animate-fade-in max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Payment Settings</h1>
                <p className="text-dark-400">
                    Manage your payment methods for ordering
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400">
                    {success}
                </div>
            )}

            {/* Admin Notice */}
            <div className="glass rounded-xl p-4 mb-6 border-l-4 border-accent-500">
                <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <span className="text-dark-300">
                        Only Admins can manage payment methods. This setting applies to your account.
                    </span>
                </div>
            </div>

            {/* Payment Methods List */}
            <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Your Payment Methods</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary text-sm"
                    >
                        {showForm ? 'Cancel' : '+ Add New'}
                    </button>
                </div>

                {/* Add Form */}
                {showForm && (
                    <form onSubmit={handleAddPaymentMethod} className="mb-6 p-4 bg-dark-800 rounded-xl">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-dark-400 mb-2">Type</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    className="input"
                                >
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="DEBIT_CARD">Debit Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="PAYPAL">PayPal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-dark-400 mb-2">Last 4 Digits</label>
                                <input
                                    type="text"
                                    value={newLastFour}
                                    onChange={(e) => setNewLastFour(e.target.value.slice(0, 4))}
                                    placeholder="1234"
                                    className="input"
                                    maxLength={4}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Payment Method'}
                        </button>
                    </form>
                )}

                {/* List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="text-4xl mb-4 block">💳</span>
                        <p className="text-dark-400">No payment methods added yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paymentMethods.map((pm) => (
                            <div
                                key={pm.id}
                                className={`
                  flex items-center justify-between p-4 rounded-xl
                  ${pm.isDefault ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-800'}
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getCardIcon(pm.type)}</span>
                                    <div>
                                        <p className="text-white font-medium">
                                            {pm.type.replace('_', ' ')} •••• {pm.lastFour}
                                        </p>
                                        {pm.isDefault && (
                                            <span className="text-xs text-primary-400">Default</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!pm.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(pm.id)}
                                            className="text-sm text-dark-400 hover:text-primary-400 transition-colors"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(pm.id)}
                                        className="text-sm text-dark-400 hover:text-red-400 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User Info */}
            <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-dark-400">Name</span>
                        <span className="text-white">{user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-dark-400">Email</span>
                        <span className="text-white">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-dark-400">Role</span>
                        <span className="badge badge-admin">{user?.role}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-dark-400">Region</span>
                        <span className="text-white">{user?.country.name}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
