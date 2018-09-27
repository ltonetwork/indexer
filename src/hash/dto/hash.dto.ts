import { ApiModelProperty } from '@nestjs/swagger';

export class HashDto {
  @ApiModelProperty()
  readonly hash: string;

  @ApiModelProperty({default: 'hex', required: false})
  readonly encoding: string;
}