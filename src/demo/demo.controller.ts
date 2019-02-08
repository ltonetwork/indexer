import {Get, Controller, Res, Render} from '@nestjs/common';
import { DemoService } from './demo.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { join } from 'path';

@Controller('demo')
export class DemoController {
  constructor(private readonly infoService: DemoService) { }

  @Get()
  @ApiExcludeEndpoint()
  async demo(@Res() res): Promise<object> {
    return res.sendFile(join(__dirname, '..', '..', 'public/demo.html'));
  }
}