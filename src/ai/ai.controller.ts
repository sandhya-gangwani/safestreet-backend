/* eslint-disable prettier/prettier */
import { Controller, Post, Body } from '@nestjs/common';
import { AiService, ClassificationResponse, DuplicateResponse } from './ai.service';

class ClassifyIncidentDto {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
}

class DetectDuplicateDto {
    description: string;
    latitude: number;
    longitude: number;
    category: string;
    nearbyIncidents: Array<{
        id: string;
        description: string;
        latitude: number;
        longitude: number;
    }>;
}

class DraftResponseDto {
    resolutionNotes: string;
    incidentType: string;
    daysSinceSubmission: number;
}

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('classify')
    async classifyIncident(@Body() dto: ClassifyIncidentDto): Promise<ClassificationResponse> {
        return this.aiService.classifyIncident(
            dto.title,
            dto.description,
            dto.latitude,
            dto.longitude
        );
    }

    @Post('detect-duplicate')
    async detectDuplicate(@Body() dto: DetectDuplicateDto): Promise<DuplicateResponse> {
        return this.aiService.detectDuplicate(
            dto.description,
            dto.latitude,
            dto.longitude,
            dto.category,
            dto.nearbyIncidents
        );
    }

    @Post('draft-response')
    async draftCitizenResponse(@Body() dto: DraftResponseDto): Promise<{ message: string }> {
        const message = await this.aiService.draftCitizenResponse(
            dto.resolutionNotes,
            dto.incidentType,
            dto.daysSinceSubmission
        );
        return { message };
    }
}