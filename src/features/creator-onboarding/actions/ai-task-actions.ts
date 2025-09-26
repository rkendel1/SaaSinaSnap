'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { getOrCreateCreatorProfile } from '../controllers/creator-profile';
import { AITaskAssistantService, type TaskAssistanceRequest, type TaskAssistanceResponse } from '../services/ai-task-assistant';

export async function getTaskAssistanceAction(
  request: TaskAssistanceRequest
): Promise<TaskAssistanceResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AITaskAssistantService.getTaskAssistance(creatorProfile, request);
}

export async function generateTaskRecommendationsAction(
  taskType: TaskAssistanceRequest['taskType']
): Promise<{
  recommendations: string[];
  quickActions: Array<{
    title: string;
    action: string;
    description: string;
  }>;
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AITaskAssistantService.generateTaskRecommendations(creatorProfile, taskType);
}