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
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && openRouterKey.trim() !== '') {
      try {
        const orClient = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: openRouterKey.trim(),
        });
        const orResponse = await orClient.chat.completions.create({
          model: 'dots-studio/dots-3-note-preview:free',
          messages: [
            {
              role: 'system',
              content: 'You are a professional nutrition AI assistant. Analyze this food image accurately in Vietnamese. If the image is a food package, look closely for the net weight (e.g. SiuKay is 128g = 524 kcal, HaoHao is 75g, etc.) or read the printed Nutrition Facts table directly. Return ONLY a valid JSON object: { "mealDetected": "Tên món ăn (kèm khối lượng, vd: Mì SiuKay 128g)", "items": [{"name": "Gói mì", "weightG": 128, "calories": 524}], "totalCalories": 524, "macros": {"protein": 9.5, "carbs": 83.2, "fat": 17} }'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Nhận diện món ăn này và tính toán dinh dưỡng chi tiết.' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
              ]
            }
          ]
        });

        const content = orResponse.choices[0]?.message?.content || '{}';
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanContent);
      } catch (err) {
        console.warn('Backend OpenRouter Vision fallback error:', err.message);
      }
    }

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
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== '') {
      try {
        const groqClient = new OpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: groqKey.trim(),
        });
        const response = await groqClient.chat.completions.create({
          model: 'openai/gpt-oss-120b',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition log parser. Convert spoken words into structured food log JSON array in Vietnamese. JSON format: { "parsedLogs": [{"foodName": string, "servingSizeG": number, "calories": number, "protein": number, "carbs": number, "fat": number, "mealType": string}] }'
            },
            {
              role: 'user',
              content: `Convert this user statement into food log items: "${transcript}"`
            }
          ]
        });
        return JSON.parse(response.choices[0].message.content || '{}');
      } catch (err) {
        console.warn('Backend Groq voice log parsing failed:', err.message);
      }
    }

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
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== '') {
      try {
        const groqClient = new OpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: groqKey.trim(),
        });
        const response = await groqClient.chat.completions.create({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content: systemInstruction || 'You are Coach Fit, a professional, encouraging personal fitness and diet coach. Give scientific, clean, short answers to the user under 4 sentences in Vietnamese.'
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
      } catch (err) {
        console.warn('Backend Groq coach response failed:', err.message);
      }
    }

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
