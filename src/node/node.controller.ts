import { Get, Controller } from '@nestjs/common';
import { NodeService } from './node.service';
import { ApiTags } from '@nestjs/swagger';
import {InfoService} from "../info/info.service";

@Controller('node')
@ApiTags('node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) { }

  @Get()
  async info(): Promise<object> {
    return await this.nodeService.getNodeInfo();
  }
}
