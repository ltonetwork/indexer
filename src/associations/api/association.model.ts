import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssociationApiModel {

  @ApiProperty()
  readonly party: string;

  @ApiProperty()
  readonly type: number;

  @ApiPropertyOptional()
  readonly hash: string;
}
