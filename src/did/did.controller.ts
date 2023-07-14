import { Controller, Res, Get, Param, Req } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LoggerService } from '../common/logger/logger.service';
import { DIDService } from './did.service';

@Controller('identifiers')
@ApiTags('DID')
export class DidController {
  constructor(
    private readonly logger: LoggerService,
    private readonly service: DIDService,
  ) {}

  @Get(':did')
  @ApiOperation({ summary: 'DID resolver' })
  @ApiParam({ name: 'did', description: 'DID or network address' })
  @ApiResponse({
    status: 200,
    description: 'DID document or DID resolution',
    content: {
      'application/json': {
        schema: {
          example: {
            '@context': 'https://www.w3.org/ns/did/v1',
            'id': 'did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW',
            'verificationMethod': [
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
            'didDocument': {
              '@context': 'https://www.w3.org/ns/did/v1',
              'id': 'did:lto:3N7RAo9eXFhJEdpPgbhsAFti8s1HDxxXiCW',
              'verificationMethod': [
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
            'didDocument': null,
            'didDocumentMetadata': {},
            'didResolutionMetadata': { error: 'notFound' },
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
          example: { error: 'failed to get DID document \'[reason]\'' },
        },
      },
      'application/ld+json;profile="https://w3id.org/did-resolution"': {
        schema: {
          example: {
            '@context': 'https://w3id.org/did-resolution/v1',
            'didDocument': null,
            'didDocumentMetadata': {},
            'didResolutionMetadata': { error: 'failed to get DID document \'[reason]\'' },
          },
        },
      },
    },
  })
  async resolve(
    @Param('did') did: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const accept = req.get('Accept') || '';
    const isDidResolution = accept.includes('application/ld+json;profile="https://w3id.org/did-resolution"');

    try {
      const didDocument = await this.service.resolve(did);

      if (!didDocument) {
        return isDidResolution
          ? res
              .status(404)
              .header('Content-Type', 'application/ld+json;profile="https://w3id.org/did-resolution";charset=utf-8')
              .json(this.didResolutionResponse(null, {}, { error: 'notFound' }))
          : res.status(404).json({ error: 'notFound' });
      }

      return isDidResolution
        ? res
            .status(200)
            .header('Content-Type', 'application/ld+json;profile="https://w3id.org/did-resolution";charset=utf-8')
            .json(this.didResolutionResponse(didDocument, {}, {}))
        : res.status(200).json(didDocument);
    } catch (e) {
      this.logger.error(`identity-controller: failed to get DID document '${e}'`, { stack: e.stack });

      return isDidResolution
        ? res
          .status(500)
          .header('Content-Type', 'application/ld+json;profile="https://w3id.org/did-resolution";charset=utf-8')
          .json(this.didResolutionResponse(null, {}, { error: 'failed to get DID document', reason: `${e}` }))
        : res.status(500).json({ error: `failed to get DID document '${e}'` });
    }
  }

  private didResolutionResponse(
    didDocument: any,
    didDocumentMetadata: Record<string, any>,
    didResolutionMetadata: Record<string, any>,
  ) {
    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didDocument,
      didDocumentMetadata,
      didResolutionMetadata,
    };
  }
}
