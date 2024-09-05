import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai = new OpenAI({
    apiKey: `${process.env.OPENAI_API_KEY}`,  
    organization: `${process.env.OPENAI_ORGANIZATION}`,
    project: `${process.env.OPENAI_PROJECT_ID}`,
});

  async enhanceIdea(idea: string): Promise<{ title: string; description: string }> {
    try {
      const prompt = `Enhance the following idea and provide a structured response:
      "${idea}"

      Respond with a JSON object containing:
      1. "title": 1 sentence title without :
      2. "description": An expanded description (2-3 sentences)`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      if (completion.choices && completion.choices[0] && completion.choices[0].message) {
        const content = JSON.parse(completion.choices[0].message.content || '{}');
        return {
          title: content.title || 'No enhanced title available',
          description: content.description || 'No enhanced description available'
        };
      } else {
        throw new Error('Unexpected response structure from OpenAI');
      }
    } catch (error) {
      console.error('Error in enhanceIdea:', error);
      return {
        title: 'Failed to enhance title',
        description: 'Failed to enhance description'
      };
    }
  }
}
