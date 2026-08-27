import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser, UserRole } from '@kia-academy/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

function roleSatisfies(userRole: UserRole, required: UserRole): boolean {
  if (userRole === required) return true;
  // SUPER_ADMIN inherits every ADMIN capability.
  if (required === 'ADMIN' && userRole === 'SUPER_ADMIN') return true;
  return false;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user || !requiredRoles.some((role) => roleSatisfies(user.role, role))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
