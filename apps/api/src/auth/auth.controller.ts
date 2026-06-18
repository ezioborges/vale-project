import {
  Body,
  Controller,
  HttpCode,
  UnauthorizedException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../common/auth/auth.constants';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Public } from '../common/auth/public.decorator';
import { Env } from '../common/config/env.validation';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

type CookieRequest = Request & {
  cookies?: Record<string, string | undefined>;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  async register(
    @Body() body: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(
      body,
      this.getMetadata(request),
    );
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return this.withoutRefreshToken(result);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(
      body,
      this.getMetadata(request),
    );
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return this.withoutRefreshToken(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken =
      body.refreshToken ?? request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const result = await this.authService.refresh(
      refreshToken,
      this.getMetadata(request),
    );
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return this.withoutRefreshToken(result);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Body() body: RefreshTokenDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(
      body.refreshToken ?? request.cookies?.[REFRESH_TOKEN_COOKIE],
      request.ip,
    );
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('email-verification')
  @HttpCode(200)
  @ApiBearerAuth()
  requestEmailVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.requestEmailVerification(user.id);
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure =
      this.configService.get('NODE_ENV', { infer: true }) === 'production';
    const accessMaxAge =
      this.configService.get('JWT_ACCESS_TTL_SECONDS', { infer: true }) * 1000;
    const refreshMaxAge =
      this.configService.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) *
      24 *
      60 *
      60 *
      1000;

    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      maxAge: accessMaxAge,
      path: '/',
      sameSite: 'lax',
      secure,
    });
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      maxAge: refreshMaxAge,
      path: '/',
      sameSite: 'lax',
      secure,
    });
  }

  private getMetadata(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }

  private withoutRefreshToken(
    result: AuthResponseDto & { refreshToken: string },
  ): AuthResponseDto {
    const { refreshToken: _refreshToken, ...safeResult } = result;
    return safeResult;
  }
}
