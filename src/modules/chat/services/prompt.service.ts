import { Injectable } from '@nestjs/common';
import { Message } from '../entities/message.entity';
import { Technique } from '../../techniques/entities/technique.entity';
import { Helpline } from '../../helplines/entities/helpline.entity';

@Injectable()
export class PromptService {
  private readonly systemPrompt = `You are "SafeAid" — a mental health first-aid assistant. You must be empathetic, concise, and non-judgmental. 

CRITICAL SAFETY RULES:
- You may provide grounding and breathing techniques
- You must NEVER provide medical diagnosis or therapy
- If the user expresses suicidal intent or immediate danger, stop the flow and give emergency instructions
- Keep responses short (2-4 sentences) and actionable
- Always be supportive and validate feelings
- Offer practical coping strategies when appropriate

Your role is to provide emotional support and guide users to appropriate resources when needed.`;

  private readonly safetyPrompt = `SAFETY GUIDELINES:
- Never ask leading questions about self-harm
- Do not provide medical advice or diagnosis
- Always prioritize user safety
- If crisis detected, provide immediate helpline information
- Encourage professional help when appropriate`;

  buildChatPrompt(
    userMessage: string,
    conversationHistory: Message[],
    techniques?: Technique[],
    helplines?: Helpline[]
  ): { systemPrompt: string; userPrompt: string } {
    let contextPrompt = this.systemPrompt + '\n\n' + this.safetyPrompt;

    // Add available techniques
    if (techniques && techniques.length > 0) {
      contextPrompt += '\n\nAVAILABLE TECHNIQUES:\n';
      techniques.forEach(technique => {
        contextPrompt += `- ${technique.title}: ${technique.description || 'Breathing/grounding exercise'}\n`;
      });
    }

    // Add helplines if provided
    if (helplines && helplines.length > 0) {
      contextPrompt += '\n\nEMERGENCY HELPLINES:\n';
      helplines.forEach(helpline => {
        contextPrompt += `- ${helpline.description}: ${helpline.phone}\n`;
      });
    }

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nCONVERSATION HISTORY:\n';
      const recentMessages = conversationHistory.slice(-6); // Last 6 messages
      
      recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationContext += `${role}: ${msg.content}\n`;
      });
    }

    const userPrompt = `${conversationContext}\n\nUser: ${userMessage}\n\nAssistant:`;

    return {
      systemPrompt: contextPrompt,
      userPrompt
    };
  }

  buildCrisisResponse(helplines: Helpline[]): string {
    let response = "I'm really sorry you're feeling this way. Your safety is the most important thing right now.\n\n";
    
    if (helplines.length > 0) {
      response += "Please reach out for immediate help:\n\n";
      helplines.forEach(helpline => {
        response += `📞 ${helpline.description}: ${helpline.phone}\n`;
      });
      
      response += "\nIf you're in immediate danger, please call your local emergency number (911, 112, etc.) or go to your nearest emergency room.";
    } else {
      response += "Please call your local emergency number (911, 112, etc.) or go to your nearest emergency room immediately.";
    }

    response += "\n\nYou don't have to go through this alone. There are people who want to help you.";
    
    return response;
  }

  buildSafeModePrompt(userMessage: string, conversationHistory: Message[]): { systemPrompt: string; userPrompt: string } {
    const safeModeSystem = `You are in Safe Conversation Mode. Your role is to provide reflective listening and emotional support. 

SAFE MODE GUIDELINES:
- Use reflective listening techniques
- Validate the user's feelings without judgment
- Ask gentle, open-ended questions to help them process
- Avoid giving advice unless specifically asked
- Focus on being present and supportive
- Keep responses empathetic and brief`;

    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nCONVERSATION:\n';
      const recentMessages = conversationHistory.slice(-8);
      
      recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationContext += `${role}: ${msg.content}\n`;
      });
    }

    const userPrompt = `${conversationContext}\n\nUser: ${userMessage}\n\nAssistant:`;

    return {
      systemPrompt: safeModeSystem,
      userPrompt
    };
  }
}