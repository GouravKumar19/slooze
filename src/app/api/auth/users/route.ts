import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                country: true,
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' },
            ],
        });

        const formattedUsers = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            country: {
                id: user.country.id,
                name: user.country.name,
                code: user.country.code,
            },
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
