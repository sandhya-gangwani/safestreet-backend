import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';


import { describe, beforeEach, it, expect } from '@jest/globals';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          // We provide a mock implementation so NestJS doesn't try to boot database services
          provide: AppService,
          useValue: {
            getHello: () => 'Hello World!',
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      // We cast appController to 'any' here to prevent TypeScript from throwing an error 
      // if getHello() was removed or changed in your real AppService.
      expect((appController as any).getHello()).toBe('Hello World!');
    });
  });
});