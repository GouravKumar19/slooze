"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

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
    menuItemCount: number;
}

export default function RestaurantsPage() {
    const { token, user } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchRestaurants() {
            if (!token) return;

            try {
                const response = await fetch('/api/restaurants', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setRestaurants(data);
                } else {
                    setError('Failed to load restaurants');
                }
            } catch (err) {
                console.error('Failed to fetch restaurants:', err);
                setError('Failed to load restaurants');
            } finally {
                setIsLoading(false);
            }
        }

        fetchRestaurants();
    }, [token]);

    const getCountryFlag = (code: string) => {
        return code === 'IN' ? '🇮🇳' : '🇺🇸';
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className="text-yellow-400">★</span>);
        }
        if (hasHalfStar) {
            stars.push(<span key="half" className="text-yellow-400">☆</span>);
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<span key={i} className="text-dark-600">★</span>);
        }
        return stars;
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Restaurants</h1>
                <p className="text-dark-400">
                    {user?.role === 'ADMIN'
                        ? 'Showing restaurants from all regions'
                        : `Showing restaurants in ${user?.country.name}`
                    }
                </p>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 mb-6">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                            <div className="h-48 bg-dark-700"></div>
                            <div className="p-6">
                                <div className="h-6 bg-dark-700 rounded mb-2 w-3/4"></div>
                                <div className="h-4 bg-dark-700 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : restaurants.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-6xl mb-4 block">🍽️</span>
                    <h3 className="text-xl font-semibold text-white mb-2">No restaurants found</h3>
                    <p className="text-dark-400">There are no restaurants available in your region.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.map((restaurant) => (
                        <Link
                            key={restaurant.id}
                            href={`/dashboard/restaurants/${restaurant.id}`}
                            className="glass rounded-2xl overflow-hidden card-hover group"
                        >
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden">
                                <Image
                                    src={restaurant.image}
                                    alt={restaurant.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getCountryFlag(restaurant.country.code)}</span>
                                        <span className="text-xs text-dark-300 bg-dark-900/50 px-2 py-1 rounded-full">
                                            {restaurant.country.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                                    {restaurant.name}
                                </h3>
                                <p className="text-sm text-dark-400 mb-3 line-clamp-2">
                                    {restaurant.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">{renderStars(restaurant.rating)}</div>
                                        <span className="text-sm text-dark-400">{restaurant.rating}</span>
                                    </div>
                                    <span className="text-xs text-dark-400 bg-dark-800 px-2 py-1 rounded-full">
                                        {restaurant.cuisine}
                                    </span>
                                </div>

                                <div className="mt-4 pt-4 border-t border-dark-700">
                                    <span className="text-sm text-dark-400">
                                        {restaurant.menuItemCount} items available
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
