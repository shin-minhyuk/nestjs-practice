import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    /// Basic $token
    /// Bearer $token

    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    // Basic 토큰인 경우 또는 Bearer 토큰이 아닌 경우 다음으로 넘김
    if (
      authHeader.toLowerCase().startsWith('basic ') ||
      !authHeader.toLowerCase().startsWith('bearer ')
    ) {
      next();
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);
      const decodedPayload = await this.jwtService.decode(token);

      if (
        !decodedPayload ||
        (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access')
      ) {
        throw new UnauthorizedException('잘못된 토큰입니다.');
      }

      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      // 토큰이 유효하면 req.user에 담고 넘김
      req.user = payload;
      next();
    } catch {
      // 토큰 검증 실패해도 다음으로 넘김 (AuthGuard에서 처리)
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(' ');

    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    const [bearer, token] = bearerSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    return token;
  }
}
