import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAI } from 'openai';

import { User } from '../users/schemas/user.schema';

@Injectable()
export class OpenAIService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
    project: process.env.OPENAI_PROJECT_ID,
  });

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private async checkThrottle(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentSubmissions = user.ideaSubmissions.filter(
      (submission) => submission > oneHourAgo,
    );

    if (recentSubmissions.length >= 30) {
      throw new BadRequestException(
        'You have submitted too many ideas recently. Please try again later.',
      );
    }

    user.ideaSubmissions.push(now);
    await user.save();
  }

  private sanitizeInput(input: string): string {
    // Remove any HTML tags and trim whitespace
    return input.replace(/<[^>]*>?/gm, '').trim();
  }

  private validateInputLength(input: string): void {
    const MAX_LENGTH = 1200; // Adjust as needed
    if (input.length > MAX_LENGTH) {
      throw new BadRequestException(
        `Idea exceeds maximum length of ${MAX_LENGTH} characters`,
      );
    }
  }

  private async filterContent(input: string): Promise<void> {
    // Basic content filtering (you may want to use a more sophisticated solution)
    const inappropriateWords = ['offensive', 'inappropriate', 'vulgar', 'bomb']; // Add more as needed
    const lowercaseInput = input.toLowerCase();
    for (const word of inappropriateWords) {
      if (lowercaseInput.includes(word)) {
        throw new BadRequestException('Input contains inappropriate content');
      }
    }
  }

  private validateResponse(content: any): {
    title: string;
    description: string;
  } {
    if (
      !content.title ||
      typeof content.title !== 'string' ||
      !content.description ||
      typeof content.description !== 'string'
    ) {
      throw new InternalServerErrorException(
        'Invalid response format from OpenAI',
      );
    }
    return {
      title: content.title,
      description: content.description,
    };
  }

  async enhanceIdea(
    idea: string,
    userId: string,
  ): Promise<{ title: string; description: string }> {
    try {
      await this.checkThrottle(userId);

      const sanitizedIdea = this.sanitizeInput(idea);
      this.validateInputLength(sanitizedIdea);
      await this.filterContent(sanitizedIdea);

      const prompt = `Enhance the following business idea and provide a structured response:
      "${sanitizedIdea}"

      Respond with a JSON object containing:
      1. "title": title without a colon in less than 12 words
      2. "description": An expanded description describing the main features and the pain points it solves in 2-3 sentences`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      if (
        completion.choices &&
        completion.choices[0] &&
        completion.choices[0].message
      ) {
        const content = JSON.parse(
          completion.choices[0].message.content || '{}',
        );
        return this.validateResponse(content);
      } else {
        throw new InternalServerErrorException(
          'Unexpected response structure from OpenAI',
        );
      }
    } catch (error) {
      console.error('Error in enhanceIdea:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to enhance idea using OpenAI',
      );
    }
  }

  async enhanceText(
    type: 'title' | 'description',
    title: string,
    description: string,
    userId: string,
  ): Promise<string> {
    try {
      await this.checkThrottle(userId);
      const sanitizedTitle = this.sanitizeInput(title);
      const sanitizedDescription = this.sanitizeInput(description);
      this.validateInputLength(sanitizedTitle);
      this.validateInputLength(sanitizedDescription);
      await this.filterContent(sanitizedTitle);
      await this.filterContent(sanitizedDescription);

      let prompt: string;
      if (type === 'title') {
        prompt = `Enhance the following title describing the idea in less than 12 words without a colon and remove any colons:
        Title: "${sanitizedTitle}"
        Description: "${sanitizedDescription}"

        Provide only the enhanced title in your response.`;
      } else {
        prompt = `Enhance the following description, making it more engaging and professional:
        Title: "${sanitizedTitle}"
        Description: "${sanitizedDescription || 'No description provided.'}"

        Provide only the description in 2-3 sentences describing the main features and the pain points it solves.`;
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        response_format: { type: 'text' },
      });

      if (
        completion.choices &&
        completion.choices[0] &&
        completion.choices[0].message
      ) {
        return this.removeQuotes(completion.choices[0].message.content.trim());
      } else {
        throw new InternalServerErrorException(
          'Unexpected response structure from OpenAI',
        );
      }
    } catch (error) {
      console.error('Error in enhanceText:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to enhance text using OpenAI',
      );
    }
  }

  private removeQuotes(str: string): string {
    return str.replace(/^"(.*)"$/, '$1');
  }
}
