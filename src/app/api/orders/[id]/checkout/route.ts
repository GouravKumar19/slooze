import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

// POST - Checkout order (place order and pay)
export async function POST(
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

        // Check permission - Only Admin and Manager can checkout
        if (!hasPermission(payload.role, 'CHECKOUT')) {
            return NextResponse.json(
                { error: 'Permission denied - only Admins and Managers can checkout orders' },
                { status: 403 }
            );
        }

        const { paymentMethodId } = await request.json();

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                items: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Order must belong to user or user must be admin
        if (order.userId !== payload.userId && payload.role !== 'ADMIN') {
            // Manager can checkout for their country's users
            if (payload.role === 'MANAGER') {
                if (order.user.countryId !== payload.countryId) {
                    return NextResponse.json(
                        { error: 'Access denied - order is not in your region' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        if (order.status !== 'DRAFT') {
            return NextResponse.json(
                { error: 'Order already submitted or cancelled' },
                { status: 400 }
            );
        }

        if (order.items.length === 0) {
            return NextResponse.json(
                { error: 'Cannot checkout empty order' },
                { status: 400 }
            );
        }

        // Get payment method
        let paymentMethod = null;
        if (paymentMethodId) {
            paymentMethod = await prisma.paymentMethod.findUnique({
                where: { id: paymentMethodId },
            });
        } else {
            // Use default payment method
            paymentMethod = await prisma.paymentMethod.findFirst({
                where: {
                    userId: order.userId,
                    isDefault: true,
                },
            });
        }

        if (!paymentMethod) {
            return NextResponse.json(
                { error: 'No payment method available' },
                { status: 400 }
            );
        }

        // Simulate payment processing
        // In real app, integrate with Stripe/PayPal etc.

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                paymentMethodId: paymentMethod.id,
            },
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
                paymentMethod: true,
                user: true,
            },
        });

        return NextResponse.json({
            message: 'Order placed successfully',
            order: {
                id: updatedOrder.id,
                status: updatedOrder.status,
                total: updatedOrder.total,
                paymentMethod: {
                    type: updatedOrder.paymentMethod?.type,
                    lastFour: updatedOrder.paymentMethod?.lastFour,
                },
            },
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
