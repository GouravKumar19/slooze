"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Role } from '@prisma/client';

interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    country: {
        id: string;
        name: string;
        code: string;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission mapping
const ROLE_PERMISSIONS: Record<Role, string[]> = {
    ADMIN: [
        'VIEW_RESTAURANTS',
        'VIEW_MENU',
        'CREATE_ORDER',
        'ADD_ITEMS',
        'CHECKOUT',
        'CANCEL_ORDER',
        'UPDATE_PAYMENT_METHOD',
    ],
    MANAGER: [
        'VIEW_RESTAURANTS',
        'VIEW_MENU',
        'CREATE_ORDER',
        'ADD_ITEMS',
        'CHECKOUT',
        'CANCEL_ORDER',
    ],
    MEMBER: [
        'VIEW_RESTAURANTS',
        'VIEW_MENU',
        'CREATE_ORDER',
        'ADD_ITEMS',
    ],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage on mount
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const hasPermission = useCallback((permission: string) => {
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
