import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

// GET - Get user's payment methods
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

        const paymentMethods = await prisma.paymentMethod.findMany({
            where: { userId: payload.userId },
            orderBy: { isDefault: 'desc' },
        });

        return NextResponse.json(
            paymentMethods.map((pm) => ({
                id: pm.id,
                type: pm.type,
                lastFour: pm.lastFour,
                isDefault: pm.isDefault,
            }))
        );
    } catch (error) {
        console.error('Get payment methods error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Add new payment method (Admin only)
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

        // Check permission - Only Admin can update payment methods
        if (!hasPermission(payload.role, 'UPDATE_PAYMENT_METHOD')) {
            return NextResponse.json(
                { error: 'Permission denied - only Admins can manage payment methods' },
                { status: 403 }
            );
        }

        const { type, lastFour, isDefault = false } = await request.json();

        if (!type || !lastFour) {
            return NextResponse.json(
                { error: 'Type and last four digits are required' },
                { status: 400 }
            );
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.paymentMethod.updateMany({
                where: { userId: payload.userId },
                data: { isDefault: false },
            });
        }

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                userId: payload.userId,
                type,
                lastFour,
                isDefault,
            },
        });

        return NextResponse.json({
            id: paymentMethod.id,
            type: paymentMethod.type,
            lastFour: paymentMethod.lastFour,
            isDefault: paymentMethod.isDefault,
        });
    } catch (error) {
        console.error('Add payment method error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update payment method (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check permission - Only Admin can update payment methods
        if (!hasPermission(payload.role, 'UPDATE_PAYMENT_METHOD')) {
            return NextResponse.json(
                { error: 'Permission denied - only Admins can manage payment methods' },
                { status: 403 }
            );
        }

        const { id, type, lastFour, isDefault } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Payment method ID is required' },
                { status: 400 }
            );
        }

        const existingMethod = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!existingMethod || existingMethod.userId !== payload.userId) {
            return NextResponse.json(
                { error: 'Payment method not found' },
                { status: 404 }
            );
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.paymentMethod.updateMany({
                where: { userId: payload.userId },
                data: { isDefault: false },
            });
        }

        const updatedMethod = await prisma.paymentMethod.update({
            where: { id },
            data: {
                type: type ?? existingMethod.type,
                lastFour: lastFour ?? existingMethod.lastFour,
                isDefault: isDefault ?? existingMethod.isDefault,
            },
        });

        return NextResponse.json({
            id: updatedMethod.id,
            type: updatedMethod.type,
            lastFour: updatedMethod.lastFour,
            isDefault: updatedMethod.isDefault,
        });
    } catch (error) {
        console.error('Update payment method error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete payment method (Admin only)
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

        // Check permission - Only Admin can update payment methods
        if (!hasPermission(payload.role, 'UPDATE_PAYMENT_METHOD')) {
            return NextResponse.json(
                { error: 'Permission denied - only Admins can manage payment methods' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Payment method ID is required' },
                { status: 400 }
            );
        }

        const existingMethod = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!existingMethod || existingMethod.userId !== payload.userId) {
            return NextResponse.json(
                { error: 'Payment method not found' },
                { status: 404 }
            );
        }

        await prisma.paymentMethod.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Payment method deleted successfully' });
    } catch (error) {
        console.error('Delete payment method error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
