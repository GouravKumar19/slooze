import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

// GET - List user's orders
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

        // Build where clause based on role
        // Admin sees all, Manager sees their country, Member sees only their own
        let whereClause = {};
        if (payload.role === 'ADMIN') {
            whereClause = {};
        } else if (payload.role === 'MANAGER') {
            whereClause = {
                user: {
                    countryId: payload.countryId,
                },
            };
        } else {
            whereClause = { userId: payload.userId };
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                    },
                },
                items: {
                    include: {
                        menuItem: {
                            include: {
                                restaurant: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                paymentMethod: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            user: {
                id: order.user.id,
                name: order.user.name,
                country: order.user.country,
            },
            items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                menuItem: {
                    id: item.menuItem.id,
                    name: item.menuItem.name,
                    image: item.menuItem.image,
                    restaurant: item.menuItem.restaurant,
                },
            })),
            paymentMethod: order.paymentMethod
                ? {
                    id: order.paymentMethod.id,
                    type: order.paymentMethod.type,
                    lastFour: order.paymentMethod.lastFour,
                }
                : null,
        }));

        return NextResponse.json(formattedOrders);
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new order (add to cart)
export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check permission
        if (!hasPermission(payload.role, 'CREATE_ORDER')) {
            return NextResponse.json(
                { error: 'Permission denied - you cannot create orders' },
                { status: 403 }
            );
        }

        const { menuItemId, quantity = 1 } = await request.json();

        if (!menuItemId) {
            return NextResponse.json(
                { error: 'Menu item ID is required' },
                { status: 400 }
            );
        }

        // Get menu item
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: menuItemId },
            include: { restaurant: true },
        });

        if (!menuItem) {
            return NextResponse.json(
                { error: 'Menu item not found' },
                { status: 404 }
            );
        }

        // Check country access for non-admins
        if (payload.role !== 'ADMIN' && menuItem.restaurant.countryId !== payload.countryId) {
            return NextResponse.json(
                { error: 'Access denied - this item is not available in your region' },
                { status: 403 }
            );
        }

        // Find or create draft order
        let order = await prisma.order.findFirst({
            where: {
                userId: payload.userId,
                status: 'DRAFT',
            },
        });

        if (!order) {
            order = await prisma.order.create({
                data: {
                    userId: payload.userId,
                    status: 'DRAFT',
                    total: 0,
                },
            });
        }

        // Check if item already in order
        const existingItem = await prisma.orderItem.findFirst({
            where: {
                orderId: order.id,
                menuItemId: menuItemId,
            },
        });

        if (existingItem) {
            // Update quantity
            await prisma.orderItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            // Add new item
            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    menuItemId: menuItemId,
                    quantity: quantity,
                    price: menuItem.price,
                },
            });
        }

        // Recalculate total
        const items = await prisma.orderItem.findMany({
            where: { orderId: order.id },
        });
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        await prisma.order.update({
            where: { id: order.id },
            data: { total },
        });

        // Return updated order
        const updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                items: {
                    include: {
                        menuItem: {
                            include: {
                                restaurant: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
