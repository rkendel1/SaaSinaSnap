import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { AIEmbedCustomizerService } from '@/features/creator/services/ai-embed-customizer';
import { openaiServerClient } from '@/libs/openai/openai-server-client'; // Import the server-only OpenAI client

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, ...payload } = await request.json();
    
    switch (action) {
      case 'start_session': {
        const { creatorId, embedType, initialOptions } = payload;
        
        if (!creatorId || !embedType || !initialOptions) {
          return NextResponse.json(
            { error: 'creatorId, embedType, and initialOptions are required' },
            { status: 400 }
          );
        }

        if (creatorId !== user.id) {
          return NextResponse.json(
            { error: 'Unauthorized: Cannot create sessions for other creators' },
            { status: 403 }
          );
        }

        const session = AIEmbedCustomizerService.startSession(
          creatorId,
          embedType,
          initialOptions
        );
        
        return NextResponse.json({
          success: true,
          session,
          message: 'AI customization session started'
        });
      }

      case 'send_message': {
        const { sessionId, message } = payload;
        
        if (!sessionId || !message) {
          return NextResponse.json(
            { error: 'sessionId and message are required' },
            { status: 400 }
          );
        }

        // Verify the user owns this session
        const session = AIEmbedCustomizerService.getSession(sessionId);
        if (!session || session.creatorId !== user.id) {
          return NextResponse.json(
            { error: 'Unauthorized: Session not found or access denied' },
            { status: 403 }
          );
        }

        // Pass the server-only OpenAI client
        const result = await AIEmbedCustomizerService.processMessage(openaiServerClient, sessionId, message);
        
        return NextResponse.json({
          success: true,
          result,
          message: 'Message processed successfully'
        });
      }

      case 'get_session': {
        const { sessionId } = payload;
        
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required' },
            { status: 400 }
          );
        }

        const session = AIEmbedCustomizerService.getSession(sessionId);
        if (!session || session.creatorId !== user.id) {
          return NextResponse.json(
            { error: 'Session not found or access denied' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          session,
          message: 'Session retrieved successfully'
        });
      }

      case 'list_sessions': {
        const sessions = AIEmbedCustomizerService.getCreatorSessions(user.id);
        
        return NextResponse.json({
          success: true,
          sessions,
          message: 'Sessions retrieved successfully'
        });
      }

      case 'complete_session': {
        const { sessionId } = payload;
        
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required' },
            { status: 400 }
          );
        }

        const session = AIEmbedCustomizerService.getSession(sessionId);
        if (!session || session.creatorId !== user.id) {
          return NextResponse.json(
            { error: 'Session not found or access denied' },
            { status: 404 }
          );
        }

        AIEmbedCustomizerService.completeSession(sessionId);
        
        return NextResponse.json({
          success: true,
          message: 'Session completed successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: start_session, send_message, get_session, list_sessions, complete_session' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI embed customization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI customization request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Embed Customization API',
    endpoints: {
      'POST /api/enhanced-extraction': 'Extract advanced branding data from URL',
    },
    features: [
      'Advanced design token extraction',
      'Voice and tone analysis',
      'Layout pattern detection',
      'Interaction pattern analysis',
      'Enhanced confidence scoring'
    ]
  });
}