"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
    const router = useRouter();
    const { token, user, hasPermission } = useAuth();
    const { cart, updateQuantity, clearCart, isLoading, refreshCart } = useCart();
    const [checkingOut, setCheckingOut] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const formatCurrency = (amount: number) => {
        if (user?.country.code === 'IN') {
            return `₹${amount.toFixed(2)}`;
        }
        return `$${amount.toFixed(2)}`;
    };

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        try {
            await updateQuantity(itemId, newQuantity);
        } catch (err) {
            setError('Failed to update quantity');
        }
    };

    const handleCheckout = async () => {
        if (!hasPermission('CHECKOUT')) {
            setError('You do not have permission to checkout. Please contact a Manager or Admin.');
            return;
        }

        if (!cart.id) return;

        setCheckingOut(true);
        setError('');

        try {
            const response = await fetch(`/api/orders/${cart.id}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Checkout failed');
            }

            setSuccess('Order placed successfully! 🎉');
            await refreshCart();

            setTimeout(() => {
                router.push('/dashboard/orders');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Checkout failed');
        } finally {
            setCheckingOut(false);
        }
    };

    const handleClearCart = async () => {
        if (confirm('Are you sure you want to clear your cart?')) {
            await clearCart();
        }
    };

    if (cart.items.length === 0) {
        return (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-white mb-8">Your Cart</h1>
                <div className="glass rounded-2xl p-12 text-center">
                    <span className="text-6xl mb-4 block">🛒</span>
                    <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
                    <p className="text-dark-400 mb-6">Add some delicious items from our restaurants!</p>
                    <Link href="/dashboard/restaurants" className="btn-primary">
                        Browse Restaurants
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Your Cart</h1>
                <button
                    onClick={handleClearCart}
                    className="text-sm text-dark-400 hover:text-red-400 transition-colors"
                >
                    Clear Cart
                </button>
            </div>

            {/* Error/Success Messages */}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item) => (
                        <div
                            key={item.id}
                            className="glass rounded-xl p-4 flex gap-4"
                        >
                            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                <Image
                                    src={item.menuItem.image}
                                    alt={item.menuItem.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white">{item.menuItem.name}</h3>
                                <p className="text-sm text-dark-400 mb-2">
                                    from {item.menuItem.restaurant.name}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                            disabled={isLoading}
                                            className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-white transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                            disabled={isLoading}
                                            className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-white transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="text-lg font-bold text-primary-400">
                                        {formatCurrency(item.subtotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-2xl p-6 sticky top-8">
                        <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-dark-400">
                                <span>Subtotal ({cart.itemCount} items)</span>
                                <span>{formatCurrency(cart.total)}</span>
                            </div>
                            <div className="flex justify-between text-dark-400">
                                <span>Tax</span>
                                <span>{formatCurrency(cart.total * 0.1)}</span>
                            </div>
                            <div className="h-px bg-dark-700"></div>
                            <div className="flex justify-between text-white font-semibold">
                                <span>Total</span>
                                <span className="text-xl">{formatCurrency(cart.total * 1.1)}</span>
                            </div>
                        </div>

                        {hasPermission('CHECKOUT') ? (
                            <button
                                onClick={handleCheckout}
                                disabled={checkingOut}
                                className="btn-primary w-full"
                            >
                                {checkingOut ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Processing...
                                    </span>
                                ) : (
                                    'Place Order'
                                )}
                            </button>
                        ) : (
                            <div className="text-center">
                                <button
                                    disabled
                                    className="btn-primary w-full opacity-50 cursor-not-allowed mb-3"
                                >
                                    Place Order
                                </button>
                                <p className="text-xs text-dark-400">
                                    ⚠️ Team Members cannot checkout orders. Please contact a Manager.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
