import { Controller, Res, Get, Param } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LoggerService } from '../common/logger/logger.service';
import { CredentialStatusService } from './credential-status.service';

@Controller('identifiers')
@ApiTags('CredentialStatus')
export class CredentialStatusController {
  constructor(private readonly logger: LoggerService, private readonly service: CredentialStatusService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Credential status for LtoStatusRegistry2023' })
  @ApiParam({ name: 'did', description: 'Credential status id' })
  @ApiResponse({
    status: 200,
    content: {
      'application/json': {
        schema: {
          example: {
            id: 'GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn',
            statements: [
              {
                type: 'issue',
                timestamp: 1688781798500000,
                signer: {
                  id: 'did:lto:3Mw3EddCivSFmMD68yRJQsM6awDxJoXUCfa#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
                },
              },
              {
                type: 'dispute',
                timestamp: 1688781798600000,
                signer: {
                  id: 'did:lto:3MqmT15dkZW4a6v4ynVhca1EdPryjCwbahH#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zGL293fxZ2uVG6KEtyJ1dKAfXJBMR2264jHivbhN5zpfD',
                },
                reason: 'Credentials compromised',
              },
              {
                type: 'suspend',
                timestamp: 1688781798700000,
                signer: {
                  id: 'did:lto:3Mw3EddCivSFmMD68yRJQsM6awDxJoXUCfa#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
                },
                reason: 'Credentials compromised',
              },
              {
                type: 'revoke',
                timestamp: 1688781798800000,
                signer: {
                  id: 'did:lto:3Mw3EddCivSFmMD68yRJQsM6awDxJoXUCfa#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
                },
              },
            ],
          },
        },
      },
    },
  })
  async get(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    return res;
  }
}
