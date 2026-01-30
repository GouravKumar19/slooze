import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { hasPermission, canAccessOrder } from '@/lib/rbac';

// GET - Get single order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    include: { country: true },
                },
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
                paymentMethod: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check access
        if (!canAccessOrder(
            payload.role,
            payload.userId,
            order.id,
            order.userId,
            payload.countryId,
            order.user.countryId
        )) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({
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
        });
    } catch (error) {
        console.error('Get order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update order item quantity
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { itemId, quantity } = await request.json();

        const order = await prisma.order.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Only order owner can modify draft orders
        if (order.userId !== payload.userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (order.status !== 'DRAFT') {
            return NextResponse.json(
                { error: 'Cannot modify order - not in draft status' },
                { status: 400 }
            );
        }

        if (quantity <= 0) {
            // Remove item
            await prisma.orderItem.delete({
                where: { id: itemId },
            });
        } else {
            // Update quantity
            await prisma.orderItem.update({
                where: { id: itemId },
                data: { quantity },
            });
        }

        // Recalculate total
        const items = await prisma.orderItem.findMany({
            where: { orderId: id },
        });
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        await prisma.order.update({
            where: { id },
            data: { total },
        });

        // Return updated order
        const updatedOrder = await prisma.order.findUnique({
            where: { id },
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
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Cancel order
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check permission - Only Admin and Manager can cancel orders
        if (!hasPermission(payload.role, 'CANCEL_ORDER')) {
            return NextResponse.json(
                { error: 'Permission denied - only Admins and Managers can cancel orders' },
                { status: 403 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check country access for managers
        if (payload.role === 'MANAGER' && order.user.countryId !== payload.countryId) {
            return NextResponse.json(
                { error: 'Access denied - order is not in your region' },
                { status: 403 }
            );
        }

        // Can only cancel non-delivered orders
        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Cannot cancel - order is already delivered or cancelled' },
                { status: 400 }
            );
        }

        // Cancel order
        await prisma.order.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        return NextResponse.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Cancel order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
