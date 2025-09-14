// services/api.ts
import { ApiRequest, ApiResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://hackermit.vercel.app/";

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

    const url = `${API_BASE_URL}/api/userQuery`;
    
    console.log('🚀 API Request Details:', {
      url,
      method: 'POST',
      sessionId: this.sessionId,
      userText: userText?.substring(0, 100) + (userText?.length > 100 ? '...' : ''),
      partialIntake,
      timestamp: new Date().toISOString(),
    });

    try {
      console.log('📡 Making fetch request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`API request failed: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('✅ API Success Response:', {
        status: data.status,
        hasIntake: !!data.intake,
        hasPartial: !!data.partial,
        hasFollowUp: !!data.follow_up,
        sessionId: data.sessionId,
      });
      
      return data;
    } catch (error) {
      console.error('💥 API Request Failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });
      
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

  async composeItinerary(intake: any, options: any, swipes: any): Promise<any> {
    const request = {
      intake,
      options,
      swipes,
    };

    const url = `${API_BASE_URL}/api/composeItinerary`;
    
    console.log('🎯 ComposeItinerary API Request:', {
      url,
      method: 'POST',
      sessionId: this.sessionId,
      intake: intake?.destinations?.map((d: any) => d.city),
      optionsCount: {
        restaurants: options?.restaurants?.length || 0,
        activities: options?.activities?.length || 0,
      },
      swipes: {
        liked: swipes?.liked?.length || 0,
        disliked: swipes?.disliked?.length || 0,
        totalSwiped: swipes?.totalSwiped || 0,
      },
      timestamp: new Date().toISOString(),
    });

    try {
      console.log('📡 Making composeItinerary request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📥 ComposeItinerary response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ComposeItinerary API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`ComposeItinerary API request failed: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ ComposeItinerary Success Response:', {
        status: data.status,
        hasItinerary: !!data.itinerary,
        itineraryTitle: data.itinerary?.title,
        totalDays: data.itinerary?.totalDays,
        sessionId: data.sessionId,
      });
      
      return data;
    } catch (error) {
      console.error('💥 ComposeItinerary API Request Failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
