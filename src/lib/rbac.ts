import { Role } from '@prisma/client';

// Permission actions
export type Permission =
    | 'VIEW_RESTAURANTS'
    | 'VIEW_MENU'
    | 'CREATE_ORDER'
    | 'ADD_ITEMS'
    | 'CHECKOUT'
    | 'CANCEL_ORDER'
    | 'UPDATE_PAYMENT_METHOD';

// Role-based permission map
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    ADMIN: [
        'VIEW_RESTAURANTS',
        'VIEW_MENU',
        'CREATE_ORDER',
        'ADD_ITEMS',
        'CHECKOUT',
        'CANCEL_ORDER',
        'UPDATE_PAYMENT_METHOD',
    ],
    MANAGER: [
        'VIEW_RESTAURANTS',
        'VIEW_MENU',
        'CREATE_ORDER',
        'ADD_ITEMS',
        'CHECKOUT',
        'CANCEL_ORDER',
    ],
    MEMBER: [
        'VIEW_RESTAURANTS',
        'VIEW_MENU',
        'CREATE_ORDER',
        'ADD_ITEMS',
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if user can access a specific country's data
 * Admins can access all countries
 * Managers and Members can only access their own country
 */
export function canAccessCountry(
    userRole: Role,
    userCountryId: string,
    targetCountryId: string
): boolean {
    if (userRole === 'ADMIN') {
        return true;
    }
    return userCountryId === targetCountryId;
}

/**
 * Check if user can access a specific order
 */
export function canAccessOrder(
    userRole: Role,
    userId: string,
    orderId: string,
    orderUserId: string,
    userCountryId: string,
    orderCountryId: string
): boolean {
    // Admin can access all orders
    if (userRole === 'ADMIN') {
        return true;
    }

    // Managers can access orders from their country
    if (userRole === 'MANAGER' && userCountryId === orderCountryId) {
        return true;
    }

    // Members can only access their own orders
    return userId === orderUserId;
}

// Export role constants for UI
export const ROLES: { value: Role; label: string }[] = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'MEMBER', label: 'Team Member' },
];
