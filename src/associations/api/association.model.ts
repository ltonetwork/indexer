import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssociationApiModel {

  @ApiProperty()
  readonly recipient: string;

  @ApiProperty()
  readonly type: number;

  @ApiPropertyOptional()
  readonly hash: string;
}
