import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  CandidateProfile,
  EmployerProfile,
  ProfileAsset,
} from '@vale/shared';
import { Request, Response } from 'express';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import {
  UpdateProfileActivationDto,
  UpdateProfileVisibilityDto,
  UploadProfileAssetDto,
} from './dto/profile-controls.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';
import { ProfilesService, UploadedProfileFile } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@RequireAcceptedTerms()
@RequireEmailVerified()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @Roles('candidate', 'employer')
  @ApiOkResponse({ description: 'Current account profile.' })
  getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CandidateProfile | EmployerProfile> {
    return this.profilesService.getMyProfile(user);
  }

  @Patch('candidate/me')
  @Roles('candidate')
  @ApiOkResponse({ description: 'Candidate profile saved.' })
  updateCandidate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateCandidateProfileDto,
    @Req() request: Request,
  ): Promise<CandidateProfile> {
    return this.profilesService.upsertCandidate(
      user,
      body,
      this.requestContext(request),
    );
  }

  @Patch('candidate/me/visibility')
  @Roles('candidate')
  @ApiOkResponse({ description: 'Candidate visibility updated.' })
  updateVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileVisibilityDto,
    @Req() request: Request,
  ): Promise<CandidateProfile> {
    return this.profilesService.updateVisibility(
      user.id,
      body.visibility,
      this.requestContext(request),
    );
  }

  @Patch('candidate/me/activation')
  @Roles('candidate')
  @ApiOkResponse({ description: 'Candidate profile activation updated.' })
  updateActivation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileActivationDto,
    @Req() request: Request,
  ): Promise<CandidateProfile> {
    return this.profilesService.updateActivation(
      user.id,
      body.isActive,
      this.requestContext(request),
    );
  }

  @Patch('employer/me')
  @Roles('employer')
  @ApiOkResponse({ description: 'Employer profile saved.' })
  updateEmployer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateEmployerProfileDto,
    @Req() request: Request,
  ): Promise<EmployerProfile> {
    return this.profilesService.upsertEmployer(
      user,
      body,
      this.requestContext(request),
    );
  }

  @Get('candidates/:id')
  @ApiOkResponse({
    description: 'Candidate profile allowed by its privacy mode.',
  })
  getCandidate(
    @Param('id') id: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<CandidateProfile> {
    return this.profilesService.getCandidateForViewer(id, viewer);
  }

  @Post('files')
  @Roles('candidate', 'employer')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Private profile file stored.' })
  uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UploadProfileAssetDto,
    @UploadedFile() file: UploadedProfileFile | undefined,
    @Req() request: Request,
  ): Promise<ProfileAsset> {
    return this.profilesService.uploadAsset(
      user,
      body.kind,
      file,
      this.requestContext(request),
    );
  }

  @Get('files/:id')
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() viewer: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.profilesService.downloadAsset(id, viewer);
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${this.asciiFileName(
        file.fileName,
      )}"`,
      'Content-Length': String(file.sizeBytes),
      'Content-Type': file.mimeType,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(file.content);
  }

  @Delete('files/:id')
  @Roles('candidate', 'employer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() owner: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<void> {
    await this.profilesService.deleteAsset(
      id,
      owner,
      this.requestContext(request),
    );
  }

  private requestContext(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }

  private asciiFileName(fileName: string): string {
    return (
      fileName
        .normalize('NFKD')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/["\\]/g, '_')
        .slice(0, 180) || 'profile-file'
    );
  }
}
