import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, JWTPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Find user with country
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { country: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Generate JWT token
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            countryId: user.countryId,
            countryCode: user.country.code,
        };

        const token = generateToken(payload);

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: {
                    id: user.country.id,
                    name: user.country.name,
                    code: user.country.code,
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
