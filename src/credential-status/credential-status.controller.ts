import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggerService } from '../common/logger/logger.service';
import { CredentialStatusService } from './credential-status.service';
import { CredentialStatus } from './interfaces/credential-status.interface';

@Controller('credential-status')
@ApiTags('verifiable credentials')
export class CredentialStatusController {
  constructor(private readonly logger: LoggerService, private readonly service: CredentialStatusService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Credential status for LtoStatusRegistry2023' })
  @ApiParam({ name: 'id', description: 'Credential status id' })
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
                timestamp: '2023-01-01T12:00:00Z',
                signer: {
                  id: 'did:lto:3Mw3EddCivSFmMD68yRJQsM6awDxJoXUCfa#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
                },
              },
              {
                type: 'dispute',
                timestamp: '2023-06-01T12:00:00Z',
                signer: {
                  id: 'did:lto:3MqmT15dkZW4a6v4ynVhca1EdPryjCwbahH#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zGL293fxZ2uVG6KEtyJ1dKAfXJBMR2264jHivbhN5zpfD',
                },
                reason: 'Credentials compromised',
              },
              {
                type: 'suspend',
                timestamp: '2023-06-01T12:03:00Z',
                signer: {
                  id: 'did:lto:3Mw3EddCivSFmMD68yRJQsM6awDxJoXUCfa#sign',
                  type: 'Ed25519VerificationKey2020',
                  publicKeyMultibase: 'zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
                },
                reason: 'Dispute by trusted party',
              },
              {
                type: 'revoke',
                timestamp: '2023-06-02T12:00:00Z',
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
  async get(@Param('id') id: string): Promise<CredentialStatus> {
    return await this.service.getStatus(id);
  }
}
