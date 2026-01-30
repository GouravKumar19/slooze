import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Get current user's cart (draft order)
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const cart = await prisma.order.findFirst({
            where: {
                userId: payload.userId,
                status: 'DRAFT',
            },
            include: {
                items: {
                    include: {
                        menuItem: {
                            include: {
                                restaurant: {
                                    select: { id: true, name: true, image: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!cart) {
            return NextResponse.json({
                id: null,
                items: [],
                total: 0,
                itemCount: 0,
            });
        }

        return NextResponse.json({
            id: cart.id,
            items: cart.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
                menuItem: {
                    id: item.menuItem.id,
                    name: item.menuItem.name,
                    description: item.menuItem.description,
                    image: item.menuItem.image,
                    restaurant: item.menuItem.restaurant,
                },
            })),
            total: cart.total,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        });
    } catch (error) {
        console.error('Get cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Clear cart
export async function DELETE(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const cart = await prisma.order.findFirst({
            where: {
                userId: payload.userId,
                status: 'DRAFT',
            },
        });

        if (cart) {
            await prisma.order.delete({
                where: { id: cart.id },
            });
        }

        return NextResponse.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
