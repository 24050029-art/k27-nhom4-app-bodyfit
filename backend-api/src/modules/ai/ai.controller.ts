import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';

import { IsString, IsOptional } from 'class-validator';

class VoiceLogDto {
  @IsString()
  transcript: string;
}

class ChatDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  systemInstruction?: string;
}

@ApiTags('AI Core Engine')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('scan-food')
  @ApiOperation({ summary: 'Phân tích món ăn từ ảnh chụp (OpenAI Vision API)' })
  async scanFoodImage(@Body() body: { imageBase64: string }) {
    return this.aiService.analyzeFoodImage(body.imageBase64);
  }

  @Post('voice-log')
  @ApiOperation({ summary: 'Chuyển đổi câu nói giọng ải thành các món ăn chi tiết' })
  async parseVoiceLog(@Body() dto: VoiceLogDto) {
    return this.aiService.parseVoiceLogTranscript(dto.transcript);
  }

  @Post('coach/chat')
  @ApiOperation({ summary: 'Trò chuyện cùng HLV dinh dưỡng thông minh' })
  async coachChat(@Body() dto: ChatDto) {
    return this.aiService.generateCoachResponse(dto.message, dto.systemInstruction);
  }
}
