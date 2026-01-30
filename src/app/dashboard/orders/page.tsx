"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Order {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    user: {
        id: string;
        name: string;
        country: {
            name: string;
            code: string;
        };
    };
    items: {
        id: string;
        quantity: number;
        price: number;
        menuItem: {
            id: string;
            name: string;
            image: string;
            restaurant: {
                id: string;
                name: string;
            };
        };
    }[];
    paymentMethod: {
        id: string;
        type: string;
        lastFour: string;
    } | null;
}

export default function OrdersPage() {
    const { token, user, hasPermission } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [token]);

    const fetchOrders = async () => {
        if (!token) return;

        try {
            const response = await fetch('/api/orders', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                // Filter out draft orders
                setOrders(data.filter((o: Order) => o.status !== 'DRAFT'));
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!hasPermission('CANCEL_ORDER')) {
            setError('You do not have permission to cancel orders.');
            return;
        }

        if (!confirm('Are you sure you want to cancel this order?')) return;

        setCancellingId(orderId);
        setError('');

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to cancel order');
            }

            setSuccess('Order cancelled successfully');
            setTimeout(() => setSuccess(''), 3000);
            fetchOrders();
        } catch (err: any) {
            setError(err.message || 'Failed to cancel order');
        } finally {
            setCancellingId(null);
        }
    };

    const formatCurrency = (amount: number, countryCode?: string) => {
        const code = countryCode || user?.country.code || 'US';
        if (code === 'IN') {
            return `₹${amount.toFixed(2)}`;
        }
        return `$${amount.toFixed(2)}`;
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'status-pending';
            case 'CONFIRMED':
                return 'status-confirmed';
            case 'CANCELLED':
                return 'status-cancelled';
            case 'DELIVERED':
                return 'status-delivered';
            default:
                return '';
        }
    };

    const getCountryFlag = (code: string) => {
        return code === 'IN' ? '🇮🇳' : '🇺🇸';
    };

    const canCancel = (order: Order) => {
        return hasPermission('CANCEL_ORDER') &&
            order.status !== 'CANCELLED' &&
            order.status !== 'DELIVERED';
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Order History</h1>
                <p className="text-dark-400">
                    {user?.role === 'ADMIN'
                        ? 'Showing all orders across regions'
                        : user?.role === 'MANAGER'
                            ? `Showing orders from ${user?.country.name}`
                            : 'Showing your orders'
                    }
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

            {/* Loading State */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                            <div className="h-6 bg-dark-700 rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-dark-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <span className="text-6xl mb-4 block">📭</span>
                    <h2 className="text-xl font-semibold text-white mb-2">No orders yet</h2>
                    <p className="text-dark-400">Your order history will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="glass rounded-2xl p-6">
                            {/* Order Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`badge ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                        {order.user.id !== user?.id && (
                                            <span className="text-sm text-dark-400">
                                                {getCountryFlag(order.user.country.code)} {order.user.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-dark-400">
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-white">
                                        {formatCurrency(order.total, order.user.country.code)}
                                    </p>
                                    {order.paymentMethod && (
                                        <p className="text-sm text-dark-400">
                                            {order.paymentMethod.type} •••• {order.paymentMethod.lastFour}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="border-t border-dark-700 pt-4 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 bg-dark-800 px-3 py-2 rounded-lg"
                                        >
                                            <span className="text-white">{item.menuItem.name}</span>
                                            <span className="text-dark-400">×{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-dark-500 mt-2">
                                    from {[...new Set(order.items.map(i => i.menuItem.restaurant.name))].join(', ')}
                                </p>
                            </div>

                            {/* Actions */}
                            {canCancel(order) && (
                                <div className="border-t border-dark-700 pt-4">
                                    <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        disabled={cancellingId === order.id}
                                        className="btn-danger text-sm"
                                    >
                                        {cancellingId === order.id ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Cancelling...
                                            </span>
                                        ) : (
                                            'Cancel Order'
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Permission notice for members */}
                            {!hasPermission('CANCEL_ORDER') && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <div className="border-t border-dark-700 pt-4">
                                    <p className="text-xs text-dark-500">
                                        ⚠️ Only Managers and Admins can cancel orders
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
