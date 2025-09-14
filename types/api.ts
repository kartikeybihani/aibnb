// types/api.ts

export interface IntakeDestination {
  city: string;
  region?: string;
  country?: string;
}

export interface IntakeDates {
  start?: string; // ISO yyyy-mm-dd
  end?: string;
}

export interface IntakeParty {
  adults: number;
  kids?: number;
}

export interface IntakeBudget {
  level?: "low" | "medium" | "high";
  per_person_daily_usd?: number;
}

export interface IntakeVibe {
  pace?: "relaxed" | "balanced" | "adventurous";
  themes?: string[];
}

export interface TravelIntake {
  destinations?: IntakeDestination[];
  dates?: IntakeDates;
  trip_length_days?: number;
  party?: IntakeParty;
  budget?: IntakeBudget;
  vibe?: IntakeVibe;
  travel_dates_for_seasonality?: boolean;
  dietary?: string[];
  extras?: Record<string, unknown>;
}

export interface FollowUpQuestion {
  question: string;
  chips: string[];
}

export interface ApiResponse {
  status: "ready" | "need_follow_up";
  sessionId?: string;
  intake?: TravelIntake;
  partial?: TravelIntake;
  follow_up?: FollowUpQuestion;
  error?: string;
}

export interface ApiRequest {
  userText?: string;
  partialIntake?: TravelIntake;
  sessionId?: string;
}
