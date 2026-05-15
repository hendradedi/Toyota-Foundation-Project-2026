import { Request, Response, NextFunction } from 'express';

// Define permissions for each role
export const rolePermissions: Record<string, string[]> = {
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'neighborhoods:read',
    'neighborhoods:write',
    'neighborhoods:delete',
    'households:read',
    'households:write',
    'households:delete',
    'waste-bank:read',
    'waste-bank:write',
    'marketplace:read',
    'marketplace:write',
    'marketplace:delete',
    'sos:read',
    'sos:write',
    'patrol:read',
    'patrol:write',
    'patrol:delete',
    'announcements:read',
    'announcements:write',
    'announcements:delete',
    'settings:read',
    'settings:write',
  ],
  rt_leader: [
    'users:read',
    'neighborhoods:read',
    'neighborhoods:write',
    'households:read',
    'households:write',
    'waste-bank:read',
    'marketplace:read',
    'sos:read',
    'patrol:read',
    'patrol:write',
    'announcements:read',
    'announcements:write',
    'announcements:delete',
  ],
  resident: [
    'users:read',
    'users:write',
    'neighborhoods:read',
    'households:read',
    'households:write',
    'waste-bank:read',
    'waste-bank:write',
    'marketplace:read',
    'marketplace:write',
    'sos:write',
    'patrol:read',
    'announcements:read',
  ],
  business_owner: [
    'users:read',
    'marketplace:read',
    'marketplace:write',
    'marketplace:delete',
    'waste-bank:read',
  ],
  security_personnel: [
    'users:read',
    'neighborhoods:read',
    'sos:read',
    'sos:write',
    'patrol:read',
    'patrol:write',
  ],
  waste_collector: [
    'users:read',
    'waste-bank:read',
    'waste-bank:write',
  ],
};

// Check if user has required permission
export const hasPermission = (userRoles: string[], requiredPermission: string): boolean => {
  for (const role of userRoles) {
    const permissions = rolePermissions[role];
    if (permissions && permissions.includes(requiredPermission)) {
      return true;
    }
  }
  return false;
};

// RBAC middleware
export const checkPermissions = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.roles || user.roles.length === 0) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some((permission) =>
      hasPermission(user.roles, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden',
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
    }

    next();
  };
};

// Get user permissions from roles
export const getUserPermissions = (roles: string[]): string[] => {
  const permissions = new Set<string>();

  for (const role of roles) {
    const rolePermissionsList = rolePermissions[role];
    if (rolePermissionsList) {
      rolePermissionsList.forEach((permission) => permissions.add(permission));
    }
  }

  return Array.from(permissions);
};

// Check if user is admin
export const isAdmin = (userRoles: string[]): boolean => {
  return userRoles.includes('admin');
};

// Check if user is RT leader
export const isRtLeader = (userRoles: string[]): boolean => {
  return userRoles.includes('rt_leader');
};
