import { ApiProperty } from '@nestjs/swagger';

export class HashDto {
  @ApiProperty()
  readonly hash: string;

  @ApiProperty({ default: 'hex', required: false })
  readonly encoding: string;
}
