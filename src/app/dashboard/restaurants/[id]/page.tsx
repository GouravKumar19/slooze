"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isVegetarian: boolean;
}

interface Restaurant {
    id: string;
    name: string;
    description: string;
    image: string;
    cuisine: string;
    rating: number;
    country: {
        id: string;
        name: string;
        code: string;
    };
    menuItems: MenuItem[];
}

export default function RestaurantDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { token, user } = useAuth();
    const { addToCart, isLoading: cartLoading } = useCart();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [addingItem, setAddingItem] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        async function fetchRestaurant() {
            if (!token) return;

            try {
                const response = await fetch(`/api/restaurants/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setRestaurant(data);
                } else {
                    const err = await response.json();
                    setError(err.error || 'Failed to load restaurant');
                }
            } catch (err) {
                console.error('Failed to fetch restaurant:', err);
                setError('Failed to load restaurant');
            } finally {
                setIsLoading(false);
            }
        }

        fetchRestaurant();
    }, [token, id]);

    const handleAddToCart = async (menuItemId: string, itemName: string) => {
        setAddingItem(menuItemId);
        try {
            await addToCart(menuItemId, 1);
            setSuccessMessage(`${itemName} added to cart!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to add to cart');
        } finally {
            setAddingItem(null);
        }
    };

    const formatCurrency = (amount: number) => {
        if (restaurant?.country.code === 'IN') {
            return `₹${amount.toFixed(2)}`;
        }
        return `$${amount.toFixed(2)}`;
    };

    const getCountryFlag = (code: string) => {
        return code === 'IN' ? '🇮🇳' : '🇺🇸';
    };

    // Group menu items by category
    const groupedItems = restaurant?.menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>) || {};

    if (isLoading) {
        return (
            <div className="animate-fade-in">
                <div className="h-64 bg-dark-800 rounded-2xl animate-pulse mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-dark-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-fade-in">
                <div className="p-8 bg-red-500/20 border border-red-500/30 rounded-2xl text-center">
                    <span className="text-4xl mb-4 block">🚫</span>
                    <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
                    <p className="text-dark-400 mb-4">{error}</p>
                    <Link href="/dashboard/restaurants" className="btn-primary">
                        Back to Restaurants
                    </Link>
                </div>
            </div>
        );
    }

    if (!restaurant) return null;

    return (
        <div className="animate-fade-in">
            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 animate-slide-down">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                        <span>✅</span>
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Back Button */}
            <Link
                href="/dashboard/restaurants"
                className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
            >
                <span>←</span>
                <span>Back to Restaurants</span>
            </Link>

            {/* Restaurant Header */}
            <div className="glass rounded-2xl overflow-hidden mb-8">
                <div className="relative h-64">
                    <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getCountryFlag(restaurant.country.code)}</span>
                            <span className="text-dark-300">{restaurant.country.name}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{restaurant.name}</h1>
                        <p className="text-dark-300">{restaurant.description}</p>
                        <div className="flex items-center gap-4 mt-4">
                            <span className="bg-dark-800/80 px-3 py-1 rounded-full text-sm text-dark-300">
                                {restaurant.cuisine}
                            </span>
                            <span className="text-yellow-400">★ {restaurant.rating}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                        <h2 className="text-xl font-semibold text-white mb-4">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="glass rounded-xl p-4 flex gap-4 group"
                                >
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                        {item.isVegetarian && (
                                            <div className="absolute top-1 left-1 w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                                                <span className="text-white text-xs">🌱</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                                        <p className="text-sm text-dark-400 line-clamp-2 mb-2">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary-400">
                                                {formatCurrency(item.price)}
                                            </span>
                                            <button
                                                onClick={() => handleAddToCart(item.id, item.name)}
                                                disabled={addingItem === item.id || cartLoading}
                                                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {addingItem === item.id ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                        Adding...
                                                    </span>
                                                ) : (
                                                    'Add to Cart'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
