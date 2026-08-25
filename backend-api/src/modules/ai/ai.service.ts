import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'mock-key',
    });
  }

  // OpenAI Vision API integration structure
  async analyzeFoodImage(imageBase64: string) {
    if (process.env.OPENAI_API_KEY === 'mock-key' || !process.env.OPENAI_API_KEY) {
      // Return simulated AI vision parsing payload
      return {
        mealDetected: 'Cơm Tấm Sườn Nướng (Simulated API)',
        items: [
          { name: 'Cơm trắng', weightG: 200, calories: 260 },
          { name: 'Sườn nướng mật ong', weightG: 120, calories: 310 },
          { name: 'Dưa leo & mỡ hành', weightG: 30, calories: 45 }
        ],
        estimatedWeightG: 350,
        totalCalories: 615,
        macros: { protein: 32, carbs: 58, fat: 25.5 }
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Analyze the food image. Detect the dishes, guess approximate weights in grams, and calculate total calories/macros. Return JSON: { "mealDetected": string, "items": [{"name": string, "weightG": number, "calories": number}], "totalCalories": number, "macros": {"protein": number, "carbs": number, "fat": number} }'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this food image.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (e) {
      throw new Error(`Failed to parse image from OpenAI: ${e.message}`);
    }
  }

  // OpenAI Whisper + GPT-4o voice logger integration structure
  async parseVoiceLogTranscript(transcript: string) {
    if (process.env.OPENAI_API_KEY === 'mock-key' || !process.env.OPENAI_API_KEY) {
      return {
        parsedLogs: [
          {
            foodName: 'Phở bò chín (Simulated Voice)',
            servingSizeG: 450,
            calories: 550,
            protein: 28,
            carbs: 65,
            fat: 12,
            mealType: 'lunch'
          }
        ]
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition log parser. Convert spoken words into structured food log JSON array. JSON format: { "parsedLogs": [{"foodName": string, "servingSizeG": number, "calories": number, "protein": number, "carbs": number, "fat": number, "mealType": string}] }'
          },
          {
            role: 'user',
            content: `Convert this user statement into food log items: "${transcript}"`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (e) {
      throw new Error(`Failed to parse transcription: ${e.message}`);
    }
  }

  async generateCoachResponse(message: string, systemInstruction?: string) {
    if (process.env.OPENAI_API_KEY === 'mock-key' || !process.env.OPENAI_API_KEY) {
      return {
        reply: 'Chào bạn! Đây là câu trả lời tư vấn từ HLV BodyFit. Để tối ưu mục tiêu của mình, hãy duy trì thói quen ghi nhật ký dinh dưỡng và tập kháng lực đều đặn nhé!',
        sentAt: new Date().toISOString()
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemInstruction || 'You are Coach Fit, a professional, encouraging personal fitness and diet coach. Give scientific, clean, short answers to the user under 4 sentences.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      });
      return {
        reply: response.choices[0].message.content,
        sentAt: new Date().toISOString()
      };
    } catch (e) {
      throw new Error(`Failed to consult Coach: ${e.message}`);
    }
  }
}
