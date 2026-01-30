import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { canAccessCountry } from '@/lib/rbac';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get and verify token
        const token = getTokenFromHeader(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get restaurant with menu items
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
            include: {
                country: true,
                menuItems: {
                    where: { isAvailable: true },
                    orderBy: [
                        { category: 'asc' },
                        { name: 'asc' },
                    ],
                },
            },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Check country access
        if (!canAccessCountry(payload.role, payload.countryId, restaurant.countryId)) {
            return NextResponse.json(
                { error: 'Access denied - this restaurant is not in your region' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            id: restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            image: restaurant.image,
            cuisine: restaurant.cuisine,
            rating: restaurant.rating,
            country: {
                id: restaurant.country.id,
                name: restaurant.country.name,
                code: restaurant.country.code,
            },
            menuItems: restaurant.menuItems.map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                category: item.category,
                isVegetarian: item.isVegetarian,
            })),
        });
    } catch (error) {
        console.error('Get restaurant error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
