/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ClassificationResponse {
    category: string;
    department: string;
    priority: string;
    rationale: string;
}

export interface DuplicateResponse {
    score: number;
    matchingIncidentId: string | null;
}

interface NearbyIncident {
    id: string;
    description: string;
    latitude: number;
    longitude: number;
}

interface OpenAIMessage {
    role: string;
    content: string;
}

interface OpenAIChoice {
    message: {
        content: string;
    };
}

interface OpenAIResponse {
    data: {
        choices: OpenAIChoice[];
    };
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly openaiApiKey: string;
    private readonly openaiModel: string;

    constructor(private configService: ConfigService) {
        this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
        this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
    }

    async classifyIncident(
        title: string,
        description: string,
        latitude: number,
        longitude: number
    ): Promise<ClassificationResponse> {
        try {
            const prompt = this.buildClassificationPrompt(title, description, latitude, longitude);
            const response = await this.callOpenAI(prompt);
            return this.parseClassificationResponse(response);
        } catch (error) {
            this.logger.error('Error classifying incident:', error);
            return this.getFallbackClassification();
        }
    }

    async detectDuplicate(
        description: string,
        latitude: number,
        longitude: number,
        category: string,
        nearbyIncidents: NearbyIncident[]
    ): Promise<DuplicateResponse> {
        try {
            if (!nearbyIncidents || nearbyIncidents.length === 0) {
                return { score: 0, matchingIncidentId: null };
            }

            const prompt = this.buildDuplicatePrompt(
                description,
                latitude,
                longitude,
                category,
                nearbyIncidents
            );
            const response = await this.callOpenAI(prompt);
            return this.parseDuplicateResponse(response);
        } catch (error) {
            this.logger.error('Error detecting duplicate:', error);
            return this.getFallbackDuplicate(nearbyIncidents);
        }
    }

    private buildClassificationPrompt(
        title: string,
        description: string,
        latitude: number,
        longitude: number
    ): string {
        return `You are an incident classification system for a city municipality.

    Title: ${title}
    Description: ${description}
    Location: (${latitude}, ${longitude})

    Classify this incident into one of these categories:
    - road_damage: Potholes, cracks, damaged roads
    - flooding: Water accumulation, drainage issues
    - power_outage: Electricity problems, fallen wires
    - water_issue: Water supply problems, pipe bursts
    - garbage: Waste collection issues
    - street_light: Broken street lights
    - other: Anything else

    Also determine priority:
    - critical: Immediate danger to life or property
    - high: Urgent but not life-threatening
    - standard: Regular issue

    And assign to one of these departments:
    - Roads, Water, Electricity, Sanitation, General

    Return a JSON response with:
    {
      "category": "road_damage",
      "department": "Roads",
      "priority": "high",
      "rationale": "One sentence explanation"
    }`;
    }

    private buildDuplicatePrompt(
        description: string,
        latitude: number,
        longitude: number,
        category: string,
        nearbyIncidents: NearbyIncident[]
    ): string {
        return `You are a duplicate incident detection system.

New Incident:
Description: ${description}
Location: (${latitude}, ${longitude})
Category: ${category}

Nearby Open Incidents:
${nearbyIncidents.map((inc, i) =>
            `${i + 1}. ID: ${inc.id}, Description: ${inc.description}, Location: (${inc.latitude}, ${inc.longitude})`
        ).join('\n')}

Compare the new incident with each nearby incident and determine the likelihood they are duplicates.

Return a JSON response with:
{
  "score": 0.85,
  "matchingIncidentId": "incident-id-here"
}

Score should be between 0 and 1:
- 0.8-1.0: Very likely duplicate
- 0.5-0.79: Possibly duplicate
- 0-0.49: Not a duplicate

If no duplicate found, set matchingIncidentId to null.`;
    }

    private async callOpenAI(prompt: string): Promise<string> {
        if (!this.openaiApiKey || this.openaiApiKey === 'your-openai-api-key') {
            this.logger.warn('OpenAI API key not configured, using fallback');
            throw new Error('OpenAI API key not configured');
        }

        try {
            const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];

            const response = await axios.post<OpenAIResponse['data']>(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: this.openaiModel,
                    messages,
                    temperature: 0.3,
                    max_tokens: 200,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No content in response');
            }
            return content;
        } catch (error) {
            this.logger.error('OpenAI API error:', error);
            throw error;
        }
    }

    private parseClassificationResponse(response: string): ClassificationResponse {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
                return {
                    category: parsed.category || 'other',
                    department: parsed.department || 'General',
                    priority: parsed.priority || 'standard',
                    rationale: parsed.rationale || 'Default classification',
                };
            }
            return this.getFallbackClassification();
        } catch {
            return this.getFallbackClassification();
        }
    }

    private parseDuplicateResponse(response: string): DuplicateResponse {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
                return {
                    score: typeof parsed.score === 'number' ? parsed.score : 0,
                    matchingIncidentId: typeof parsed.matchingIncidentId === 'string'
                        ? parsed.matchingIncidentId
                        : null,
                };
            }
            return { score: 0, matchingIncidentId: null };
        } catch {
            return { score: 0, matchingIncidentId: null };
        }
    }

    private getFallbackClassification(): ClassificationResponse {
        return {
            category: 'other',
            department: 'General',
            priority: 'standard',
            rationale: 'Default classification due to AI unavailability',
        };
    }

    private getFallbackDuplicate(nearbyIncidents: NearbyIncident[]): DuplicateResponse {
        // If there are nearby incidents, flag for manual review
        if (nearbyIncidents.length > 0) {
            return {
                score: 0.5,
                matchingIncidentId: nearbyIncidents[0]?.id || null,
            };
        }
        return { score: 0, matchingIncidentId: null };
    }

    async draftCitizenResponse(
        resolutionNotes: string,
        incidentType: string,
        daysSinceSubmission: number
    ): Promise<string> {
        try {
            const prompt = this.buildResponsePrompt(
                resolutionNotes,
                incidentType,
                daysSinceSubmission
            );
            const response = await this.callOpenAI(prompt);
            return this.parseResponse(response);
        } catch (error) {
            this.logger.error('Error drafting citizen response:', error);
            return this.getFallbackResponse(resolutionNotes);
        }
    }

    private buildResponsePrompt(
        resolutionNotes: string,
        incidentType: string,
        daysSinceSubmission: number
    ): string {
        return `You are a empathetic citizen communication assistant for a city municipality.

Incident Type: ${incidentType}
Days Since Submission: ${daysSinceSubmission}
Resolution Notes: ${resolutionNotes}

Draft a short, empathetic citizen message (3-4 sentences) that:
1. Acknowledges the issue
2. Explains what was done
3. Thanks the citizen
4. Is warm and professional

Keep it concise and caring.`;
    }

    private parseResponse(response: string): string {
        try {
            // Try to extract text if it's wrapped in quotes
            const match = response.match(/"([^"]*)"/);
            if (match) {
                return match[1];
            }
            // Return as-is if no quotes
            return response.trim();
        } catch {
            return this.getFallbackResponse('We have resolved your issue.');
        }
    }

    private getFallbackResponse(resolutionNotes: string): string {
        return `Dear citizen, we have addressed your concern. ${resolutionNotes} Thank you for helping us improve our city.`;
    }
}