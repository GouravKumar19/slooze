"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, isLoading, hasPermission } = useAuth();
    const { cart } = useCart();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Restaurants', href: '/dashboard/restaurants', icon: '🍽️' },
        { name: 'Cart', href: '/dashboard/cart', icon: '🛒', badge: cart.itemCount },
        { name: 'Orders', href: '/dashboard/orders', icon: '📋' },
    ];

    // Only show Settings for Admin
    if (hasPermission('UPDATE_PAYMENT_METHOD')) {
        navigation.push({ name: 'Settings', href: '/dashboard/settings', icon: '⚙️' });
    }

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'badge badge-admin';
            case 'MANAGER':
                return 'badge badge-manager';
            case 'MEMBER':
                return 'badge badge-member';
            default:
                return 'badge';
        }
    };

    const getCountryFlag = (code: string) => {
        return code === 'IN' ? '🇮🇳' : '🇺🇸';
    };

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-800 z-50">
                {/* Logo */}
                <div className="p-6 border-b border-dark-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-xl">🍔</span>
                        </div>
                        <span className="text-xl font-bold gradient-text">FoodHub</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                                    }
                `}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <span>{getCountryFlag(user.country.code)}</span>
                            </div>
                            <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="ml-64 min-h-screen">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
