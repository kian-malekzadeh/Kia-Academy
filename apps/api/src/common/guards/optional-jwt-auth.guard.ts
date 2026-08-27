import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Attaches a user when a valid bearer token is present without requiring one. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser | false | null): TUser | null {
    if (err || !user) return null;
    return user;
  }
}
