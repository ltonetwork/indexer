import { Get, Controller } from '@nestjs/common';
import { InfoService } from './info.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('info')
@ApiTags('info')
export class InfoController {
  constructor(private readonly infoService: InfoService) { }

  @Get()
  async info(): Promise<object> {
    return await this.infoService.info();
  }
}
