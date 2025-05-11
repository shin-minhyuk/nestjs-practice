import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Role>(RBAC, context.getHandler());

    if (!Object.values(Role).includes(role)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      return false;
    }

    // INFO: 사용자의 권한이 조건 권한보다 level이 높을 경우 ture
    //       사용자 권한(0 == admin) <= 조건 (2 == user)
    if (user.role > role) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return user.role <= role; // return true 랑 같은 동작, 사용자 권한이 조건 권한보다 낮거나 같으면 true
  }
}
