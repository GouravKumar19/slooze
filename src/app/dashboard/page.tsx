"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface OrderStats {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
}

export default function DashboardPage() {
    const { user, token, hasPermission } = useAuth();
    const { cart } = useCart();
    const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!token) return;

            try {
                const response = await fetch('/api/orders', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const orders = await response.json();

                    // Calculate stats
                    const stats = {
                        total: orders.length,
                        pending: orders.filter((o: any) => o.status === 'PENDING').length,
                        confirmed: orders.filter((o: any) => o.status === 'CONFIRMED').length,
                        cancelled: orders.filter((o: any) => o.status === 'CANCELLED').length,
                    };
                    setOrderStats(stats);

                    // Get recent orders (excluding drafts)
                    setRecentOrders(orders.filter((o: any) => o.status !== 'DRAFT').slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [token]);

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'status-draft';
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

    const formatCurrency = (amount: number, countryCode: string) => {
        if (countryCode === 'IN') {
            return `₹${amount.toFixed(2)}`;
        }
        return `$${amount.toFixed(2)}`;
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-dark-400">
                    Here&apos;s what&apos;s happening with your food orders today.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                    href="/dashboard/restaurants"
                    className="glass rounded-2xl p-6 card-hover group"
                >
                    <div className="text-3xl mb-3">🍽️</div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                        Browse Restaurants
                    </h3>
                    <p className="text-sm text-dark-400">
                        {user?.role === 'ADMIN' ? 'All regions' : `${user?.country.name} only`}
                    </p>
                </Link>

                <Link
                    href="/dashboard/cart"
                    className="glass rounded-2xl p-6 card-hover group"
                >
                    <div className="text-3xl mb-3">🛒</div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                        Your Cart
                    </h3>
                    <p className="text-sm text-dark-400">
                        {cart.itemCount} items • {formatCurrency(cart.total, user?.country.code || 'US')}
                    </p>
                </Link>

                <Link
                    href="/dashboard/orders"
                    className="glass rounded-2xl p-6 card-hover group"
                >
                    <div className="text-3xl mb-3">📋</div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                        Order History
                    </h3>
                    <p className="text-sm text-dark-400">
                        {orderStats.total} total orders
                    </p>
                </Link>

                {hasPermission('UPDATE_PAYMENT_METHOD') && (
                    <Link
                        href="/dashboard/settings"
                        className="glass rounded-2xl p-6 card-hover group"
                    >
                        <div className="text-3xl mb-3">💳</div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                            Payment Settings
                        </h3>
                        <p className="text-sm text-dark-400">
                            Manage payment methods
                        </p>
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-dark-400 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-white">{orderStats.total}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <span className="text-xl">📊</span>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-dark-400 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-400">{orderStats.pending}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <span className="text-xl">⏳</span>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-dark-400 mb-1">Confirmed</p>
                            <p className="text-2xl font-bold text-green-400">{orderStats.confirmed}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <span className="text-xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-dark-400 mb-1">Cancelled</p>
                            <p className="text-2xl font-bold text-red-400">{orderStats.cancelled}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <span className="text-xl">❌</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Access Info Card */}
            <div className="glass rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Your Access Level</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <span className="text-dark-300">View Restaurants</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <span className="text-dark-300">Add to Cart</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{hasPermission('CHECKOUT') ? '✅' : '❌'}</span>
                        <span className={hasPermission('CHECKOUT') ? 'text-dark-300' : 'text-dark-500'}>
                            Checkout & Pay
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{hasPermission('CANCEL_ORDER') ? '✅' : '❌'}</span>
                        <span className={hasPermission('CANCEL_ORDER') ? 'text-dark-300' : 'text-dark-500'}>
                            Cancel Order
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{hasPermission('UPDATE_PAYMENT_METHOD') ? '✅' : '❌'}</span>
                        <span className={hasPermission('UPDATE_PAYMENT_METHOD') ? 'text-dark-300' : 'text-dark-500'}>
                            Payment Settings
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                    <Link href="/dashboard/orders" className="text-sm text-primary-400 hover:text-primary-300">
                        View all →
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-dark-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="text-4xl mb-4 block">📭</span>
                        <p className="text-dark-400">No orders yet. Start by browsing restaurants!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-4 bg-dark-800 rounded-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">🍽️</div>
                                    <div>
                                        <p className="text-sm text-white">
                                            {order.items.length} items
                                        </p>
                                        <p className="text-xs text-dark-400">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-white font-medium">
                                        {formatCurrency(order.total, user?.country.code || 'US')}
                                    </span>
                                    <span className={`badge ${getStatusClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
