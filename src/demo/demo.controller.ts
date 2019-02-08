import {Get, Controller, Res, Render} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { join } from 'path';

@Controller('demo')
export class DemoController {

  @Get()
  @ApiExcludeEndpoint()
  async demo(@Res() res): Promise<object> {
    return res.sendFile(join(__dirname, '..', '..', 'public/demo.html'));
  }
}