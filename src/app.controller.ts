import { WebhookRequestBody } from '@line/bot-sdk';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('webhook')
  webhook(@Body() webhookRequest: WebhookRequestBody) {
    if (webhookRequest.events.length > 0) {
      return this.appService.webhook(webhookRequest.events[0]);
    }
    return null;
  }
}
