// intn-backend/test/auth.integration.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userModel: Model<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refresh access token when it expires', async () => {
    // Increase timeout to 15 seconds
    jest.setTimeout(15000);

    // Create a test user
    const testUser = await userModel.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      upvotedIdeas: [],
      viewedIdeas: [],
      ideaSubmissions: [],
    });

    // Generate initial tokens
    const { accessToken, refreshToken } = await authService.generateTokens(testUser);

    // Wait for the access token to expire (6 seconds)
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Attempt to refresh the token
    const response = await request(app.getHttpServer())
      .post('/auth/google/refresh')
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(200);

    expect(response.body.message).toBe('Tokens refreshed successfully');
    expect(response.headers['set-cookie']).toBeDefined();

    const cookies = Array.isArray(response.headers['set-cookie']) 
      ? response.headers['set-cookie'] 
      : [response.headers['set-cookie']];
    
    const newAccessToken = cookies.find(cookie => cookie.startsWith('auth_token='));
    const newRefreshToken = cookies.find(cookie => cookie.startsWith('refresh_token='));

    expect(newAccessToken).toBeDefined();
    expect(newRefreshToken).toBeDefined();

    // Verify that the new access token is different from the old one
    expect(newAccessToken).not.toEqual(accessToken);

    // Clean up
    await userModel.deleteOne({ _id: testUser._id });
  });
});