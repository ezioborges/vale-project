import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  @Get('registration-config')
  registrationConfig() {
    return {
      legalDocuments: {
        terms: this.configService.get('LEGAL_TERMS_VERSION', { infer: true }),
        privacy: this.configService.get('LEGAL_PRIVACY_VERSION', {
          infer: true,
        }),
        guidelines: this.configService.get('LEGAL_GUIDELINES_VERSION', {
          infer: true,
        }),
      },
    };
  }

  @Public()
  @Post('register')
  @RateLimit({ name: 'auth:register', limit: 5, windowSeconds: 600 })
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
    return this.withoutTokens(result);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @RateLimit({ name: 'auth:login', limit: 10, windowSeconds: 300 })
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
    return this.withoutTokens(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @RateLimit({ name: 'auth:refresh', limit: 30, windowSeconds: 60 })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken =
      body?.refreshToken ?? request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const result = await this.authService.refresh(
      refreshToken,
      this.getMetadata(request),
    );
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return this.withoutTokens(result);
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
      body?.refreshToken ?? request.cookies?.[REFRESH_TOKEN_COOKIE],
      request.ip,
    );
    this.clearAuthCookies(response);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  @RateLimit({ name: 'auth:verify-email', limit: 20, windowSeconds: 300 })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('email-verification')
  @HttpCode(200)
  @RateLimit({
    name: 'auth:email-verification',
    limit: 5,
    windowSeconds: 900,
  })
  @ApiBearerAuth()
  requestEmailVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.requestEmailVerification(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @RateLimit({ name: 'auth:forgot-password', limit: 5, windowSeconds: 900 })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @RateLimit({ name: 'auth:reset-password', limit: 10, windowSeconds: 900 })
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(
      body.token,
      body.password,
      this.getMetadata(request),
    );
    this.clearAuthCookies(response);
    return result;
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const refreshMaxAge =
      this.configService.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) *
      24 *
      60 *
      60 *
      1000;

    this.setAccessCookie(response, accessToken);
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      maxAge: refreshMaxAge,
      path: '/',
      sameSite: 'lax',
      secure:
        this.configService.get('NODE_ENV', { infer: true }) === 'production',
    });
  }

  private setAccessCookie(response: Response, accessToken: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      maxAge:
        this.configService.get('JWT_ACCESS_TTL_SECONDS', { infer: true }) *
        1000,
      path: '/',
      sameSite: 'lax',
      secure:
        this.configService.get('NODE_ENV', { infer: true }) === 'production',
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private getMetadata(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }

  private withoutTokens(
    result: AuthResponseDto & {
      accessToken: string;
      refreshToken: string;
    },
  ): AuthResponseDto {
    const {
      accessToken: _accessToken,
      refreshToken: _refreshToken,
      ...safeResult
    } = result;
    return safeResult;
  }
}
