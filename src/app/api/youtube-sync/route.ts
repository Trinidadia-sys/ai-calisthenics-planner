import { NextRequest, NextResponse } from 'next/server';
import { VideoDiscoveryAgent } from '@/agents/videoDiscoveryAgent';
import { ExerciseExtractionAgent } from '@/agents/exerciseExtractionAgent';
import { ExerciseEmbeddingService } from '@/rag/embedExercises';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (only allow admins or specific users)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to run sync (you might want to implement admin check)
    // For now, allow any authenticated user to trigger sync

    const apiKey = process.env.YOUTUBE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || !openaiKey) {
      return NextResponse.json(
        { error: 'Missing required API keys' },
        { status: 500 }
      );
    }

    // Initialize agents
    const videoAgent = new VideoDiscoveryAgent(apiKey);
    const exerciseAgent = new ExerciseExtractionAgent(openaiKey);
    const embeddingService = new ExerciseEmbeddingService(openaiKey);

    // Step 1: Discover videos
    console.log('Discovering YouTube videos...');
    const videos = await videoAgent.discoverCalisthenicsVideos();
    
    // Store videos in database
    for (const video of videos) {
      try {
        const { data: existingVideo, error: checkError } = await supabaseAdmin
          .from('youtube_videos')
          .select('id')
          .eq('url', video.url)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // Not found error
          console.error('Error checking existing video:', checkError);
          continue;
        }

        if (!existingVideo) {
          const { error: insertError } = await supabaseAdmin
            .from('youtube_videos')
            .insert({
              title: video.title,
              url: video.url,
              channel: video.channel,
              transcript: video.transcript
            });

          if (insertError) {
            console.error('Error inserting video:', insertError);
          }
        }
      } catch (error) {
        console.error('Error processing video:', video.title, error);
      }
    }

    // Step 2: Extract exercises from videos
    console.log('Extracting exercises from videos...');
    const { data: storedVideos, error: videosError } = await supabaseAdmin
      .from('youtube_videos')
      .select('*')
      .limit(10); // Process last 10 videos

    if (videosError) {
      console.error('Error fetching videos for exercise extraction:', videosError);
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      );
    }

    for (const video of storedVideos || []) {
      try {
        // Get transcript (for now using placeholder)
        const transcript = video.transcript || `Sample transcript for ${video.title}`;
        
        // Extract exercises
        const exercises = await exerciseAgent.extractExercisesFromTranscript(transcript, video);
        
        // Store exercises
        for (const exercise of exercises) {
          try {
            // Validate exercise
            const isValid = await exerciseAgent.validateExercise(exercise);
            if (!isValid) {
              console.log('Skipping invalid exercise:', exercise.name);
              continue;
            }

            // Check if exercise already exists
            const { data: existingExercise, error: checkError } = await supabaseAdmin
              .from('exercises')
              .select('id')
              .ilike('name', exercise.name!)
              .single();

            if (checkError && checkError.code !== 'PGRST116') { // Not found error
              console.error('Error checking existing exercise:', checkError);
              continue;
            }

            if (!existingExercise) {
              const { error: insertError } = await supabaseAdmin
                .from('exercises')
                .insert({
                  name: exercise.name!,
                  difficulty: exercise.difficulty || 'Beginner',
                  description: exercise.description,
                  video_url: exercise.video_url
                });

              if (insertError) {
                console.error('Error inserting exercise:', insertError);
              }
            }
          } catch (error) {
            console.error('Error processing exercise:', exercise.name, error);
          }
        }
      } catch (error) {
        console.error('Error extracting exercises from video:', video.title, error);
      }
    }

    // Step 3: Generate embeddings for new exercises
    console.log('Generating embeddings for exercises...');
    await embeddingService.embedAllExercises();

    return NextResponse.json({
      success: true,
      message: 'YouTube sync completed successfully',
      videosProcessed: videos.length,
      exercisesExtracted: 'Check logs for details'
    });

  } catch (error: any) {
    console.error('Error in YouTube sync:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'YouTube sync failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
