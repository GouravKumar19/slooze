import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role: Role;
    countryId: string;
    countryCode: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h',
    });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
