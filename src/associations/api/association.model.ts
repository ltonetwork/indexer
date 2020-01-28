import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

export class AssociationApiModel {

  @ApiModelProperty()
  readonly party: string;

  @ApiModelProperty()
  readonly type: number;

  @ApiModelPropertyOptional()
  readonly hash: string;
}
