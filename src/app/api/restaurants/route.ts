import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
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

        // Build where clause based on user role
        // Admin sees all restaurants, others see only their country
        const whereClause = payload.role === 'ADMIN'
            ? {}
            : { countryId: payload.countryId };

        const restaurants = await prisma.restaurant.findMany({
            where: whereClause,
            include: {
                country: true,
                _count: {
                    select: { menuItems: true },
                },
            },
            orderBy: { rating: 'desc' },
        });

        const formattedRestaurants = restaurants.map((restaurant) => ({
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
            menuItemCount: restaurant._count.menuItems,
        }));

        return NextResponse.json(formattedRestaurants);
    } catch (error) {
        console.error('Get restaurants error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
