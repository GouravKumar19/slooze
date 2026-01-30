"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    menuItem: {
        id: string;
        name: string;
        description: string;
        image: string;
        restaurant: {
            id: string;
            name: string;
            image: string;
        };
    };
}

interface Cart {
    id: string | null;
    items: CartItem[];
    total: number;
    itemCount: number;
}

interface CartContextType {
    cart: Cart;
    isLoading: boolean;
    addToCart: (menuItemId: string, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const emptyCart: Cart = {
    id: null,
    items: [],
    total: 0,
    itemCount: 0,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const [cart, setCart] = useState<Cart>(emptyCart);
    const [isLoading, setIsLoading] = useState(false);

    const refreshCart = useCallback(async () => {
        if (!token) {
            setCart(emptyCart);
            return;
        }

        try {
            const response = await fetch('/api/cart', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCart(data);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    }, [token]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = useCallback(async (menuItemId: string, quantity = 1) => {
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ menuItemId, quantity }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add to cart');
            }

            await refreshCart();
        } catch (error) {
            console.error('Add to cart error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [token, refreshCart]);

    const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
        if (!token || !cart.id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${cart.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId, quantity }),
            });

            if (!response.ok) {
                throw new Error('Failed to update quantity');
            }

            await refreshCart();
        } catch (error) {
            console.error('Update quantity error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [token, cart.id, refreshCart]);

    const clearCart = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            await fetch('/api/cart', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            setCart(emptyCart);
        } catch (error) {
            console.error('Clear cart error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    return (
        <CartContext.Provider value={{ cart, isLoading, addToCart, updateQuantity, clearCart, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
