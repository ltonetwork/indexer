import { Controller, Res, Get, Param, Req, Query } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LoggerService } from '../common/logger/logger.service';
import { DIDService } from './did.service';

@Controller('identifiers')
@ApiTags('DID')
export class DidController {
  constructor(private readonly logger: LoggerService, private readonly service: DIDService) {}

  @Get(':did')
  @ApiOperation({ summary: 'DID resolver' })
  @ApiParam({ name: 'did', description: 'DID or network address' })
  @ApiQuery({
    name: 'versionTime',
    description: 'Get the DID document that was valid at the specified time',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'DID document or DID resolution',
    content: {
      'application/json': {
        schema: {
          example: {
            '@context': 'https://www.w3.org/ns/did/v1',
            id: 'did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW',
            verificationMethod: [
              {
                id: `did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW#sign`,
                type: 'Ed25519VerificationKey2020',
                controller: `did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW`,
                publicKeyBase58: '3ct1eeZg1ryzz24VHk4CigJxW6Adxh7Syfm459CmGNv2',
                blockchainAccountId: `3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW@lto:T`,
              },
            ],
          },
        },
      },
      'application/ld+json;profile="https://w3id.org/did-resolution"': {
        schema: {
          example: {
            '@context': 'https://w3id.org/did-resolution/v1',
            didDocument: {
              '@context': 'https://www.w3.org/ns/did/v1',
              id: 'did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW',
              verificationMethod: [
                {
                  id: `did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW#sign`,
                  type: 'Ed25519VerificationKey2020',
                  controller: `did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW`,
                  publicKeyBase58: '3ct1eeZg1ryzz24VHk4CigJxW6Adxh7Syfm459CmGNv2',
                  blockchainAccountId: `3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW@lto:T`,
                },
              ],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'DID not found',
    content: {
      'application/json': {
        schema: {
          example: { error: 'notFound' },
        },
      },
      'application/ld+json;profile="https://w3id.org/did-resolution"': {
        schema: {
          example: {
            '@context': 'https://w3id.org/did-resolution/v1',
            didDocument: null,
            didDocumentMetadata: {},
            didResolutionMetadata: { error: 'notFound' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    content: {
      'application/json': {
        schema: {
          example: { error: "failed to get DID document '[reason]'" },
        },
      },
      'application/ld+json;profile="https://w3id.org/did-resolution"': {
        schema: {
          example: {
            '@context': 'https://w3id.org/did-resolution/v1',
            didDocument: null,
            didDocumentMetadata: {},
            didResolutionMetadata: { error: "failed to get DID document '[reason]'" },
          },
        },
      },
    },
  })
  async resolve(
    @Req() req: Request,
    @Res() res: Response,
    @Param('did') did: string,
    @Query('versionTime') versionTime?: string,
  ): Promise<Response> {
    const accept = req.get('Accept') || '';
    const isDidResolution = accept.includes('application/ld+json;profile="https://w3id.org/did-resolution"');

    const versionTimeDate = versionTime ? new Date(versionTime) : undefined;
    if (versionTimeDate) versionTimeDate.setMilliseconds(999);

    return isDidResolution
      ? this.resolveResolution(did, versionTimeDate, res)
      : this.resolveDocument(did, versionTimeDate, res);
  }

  private async resolveDocument(did: string, versionTime: Date | undefined, res: Response): Promise<Response> {
    try {
      const didDocument = await this.service.resolveDocument(did, versionTime);
      return didDocument ? res.status(200).json(didDocument) : res.status(404).json({ error: 'notFound' });
    } catch (e) {
      this.logger.error(`did-controller: failed to get DID document '${e}'`, { stack: e.stack });
      return res.status(500).json({ error: `failed to get DID document '${e}'` });
    }
  }

  private async resolveResolution(did: string, versionTime: Date | undefined, res: Response): Promise<Response> {
    try {
      const resolution = await this.service.resolve(did, versionTime);

      return res
        .status(resolution.didResolutionMetadata.error ? 404 : 200)
        .header('Content-Type', 'application/ld+json;profile="https://w3id.org/did-resolution";charset=utf-8')
        .json(resolution);
    } catch (e) {
      this.logger.error(`did-controller: failed to resolve DID '${e}'`, { stack: e.stack });

      return res
        .status(500)
        .header('Content-Type', 'application/ld+json;profile="https://w3id.org/did-resolution";charset=utf-8')
        .json({
          '@context': 'https://w3id.org/did-resolution/v1',
          didDocument: {},
          didDocumentMetadata: {},
          didResolutionMetadata: { error: 'failed to get DID document', reason: `${e}` },
        });
    }
  }
}
