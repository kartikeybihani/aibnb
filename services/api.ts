// services/api.ts
import { ApiRequest, ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hackermit-f6018pbh7-kartikey-bihanis-projects.vercel.app/';

export class TravelIntakeAPI {
  private sessionId: string;

  constructor() {
    this.sessionId = Date.now().toString();
  }

  async processUserInput(userText: string, partialIntake?: any): Promise<ApiResponse> {
    const request: ApiRequest = {
      userText,
      partialIntake,
      sessionId: this.sessionId,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/userQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        status: 'need_follow_up',
        follow_up: {
          question: 'Sorry, I had trouble processing that. Could you try again?',
          chips: ['Try again', 'Start over'],
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
