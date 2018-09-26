import { Get, Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

@Controller()
@ApiUseTags('application')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ title: 'Get application info' })
  @ApiResponse({ status: 200 })
  async info(): Promise<object> {
    return await this.appService.info();
  }
}
