import { Module } from '@nestjs/common';
import { TicketAttachmentStorageService } from './ticket-attachment-storage.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketAttachmentStorageService],
  exports: [TicketsService],
})
export class TicketsModule {}
