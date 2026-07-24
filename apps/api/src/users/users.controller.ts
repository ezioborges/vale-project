import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @RequireAcceptedTerms()
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser): UserResponseDto {
    const { authVersion: _authVersion, ...publicUser } = user;

    return {
      ...publicUser,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    };
  }

  @Patch(':id/role')
  @Roles('admin')
  @RequireAcceptedTerms()
  @RequireEmailVerified()
  @ApiOkResponse({ type: UserResponseDto })
  updateRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, body.role, {
      actorUserId: actor.id,
      reason: body.reason,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    });
  }

  @Patch(':id/status')
  @Roles('admin')
  @RequireAcceptedTerms()
  @RequireEmailVerified()
  @ApiOkResponse({ type: UserResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(id, body.status, {
      actorUserId: actor.id,
      reason: body.reason,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    });
  }
}
