import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

export class HashDto {
  @ApiModelProperty()
  readonly hash: string;

  @ApiModelPropertyOptional()
  readonly encoding: string;
}