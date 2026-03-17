import OpenAI from 'openai';
import { Exercise, YouTubeVideo } from '../types';

// Fix 6: typed interface for raw GPT response instead of `any`
interface RawExtractedExercise {
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  sets?: string | number;
  reps?: string | number;
}

export class ExerciseExtractionAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async extractExercisesFromTranscript(
    transcript: string,
    video: YouTubeVideo
  ): Promise<Partial<Exercise>[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Fix 5: updated from outdated gpt-4
        messages: [
          {
            role: 'system',
            content: `You are a fitness expert specializing in calisthenics. Extract exercises from video transcripts.
            
            Return a JSON array of exercises with the following structure:
            [
              {
                "name": "exercise name",
                "difficulty": "Beginner|Intermediate|Advanced|Expert",
                "description": "brief description of how to perform the exercise",
                "sets": 3,
                "reps": 10
              }
            ]
            
            sets and reps must be integers, not strings. Only extract actual exercises, not general fitness advice. Focus on bodyweight movements.`,
          },
          {
            role: 'user',
            content: `Extract exercises from this calisthenics video transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      // Fix 1: strip markdown fences before parsing
      const cleaned = content.replace(/```json\n?|```/g, '').trim();

      let exercises: RawExtractedExercise[];
      try {
        const parsed = JSON.parse(cleaned);
        // Fix 2: guard against non-array responses
        if (!Array.isArray(parsed)) {
          console.error('Expected an array from GPT, got:', typeof parsed);
          return [];
        }
        exercises = parsed;
      } catch (parseError) {
        console.error('Failed to parse GPT response as JSON:', parseError);
        return [];
      }

      const extracted: Partial<Exercise>[] = exercises.map((exercise) => ({
        ...exercise,
        // Fix 3: coerce sets/reps to integers to match DB schema
        sets: exercise.sets !== undefined ? parseInt(String(exercise.sets)) || undefined : undefined,
        reps: exercise.reps !== undefined ? parseInt(String(exercise.reps)) || undefined : undefined,
        video_url: video.url,
      }));

      // Fix 4: actually run validation on each extracted exercise
      const validated = await Promise.all(
        extracted.map(async (ex) => {
          const isValid = await this.validateExercise(ex);
          return isValid ? ex : null;
        })
      );

      return validated.filter((ex): ex is Partial<Exercise> => ex !== null);

    } catch (error) {
      // Fix 7: include more context in error log
      console.error('Error extracting exercises from transcript for video:', video.url, error);
      return [];
    }
  }

  async validateExercise(exercise: Partial<Exercise>): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Fix 5: updated from outdated gpt-4
        messages: [
          {
            role: 'system',
            content:
              'You are a fitness expert. Validate if the following is a legitimate calisthenics exercise. Respond with only "true" or "false".',
          },
          {
            role: 'user',
            content: `Exercise: ${exercise.name}\nDescription: ${exercise.description}\n\nIs this a valid calisthenics exercise?`,
          },
        ],
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content?.trim().toLowerCase();
      return content === 'true';

    } catch (error) {
      // Fix 7: include exercise name in error log for easier debugging
      console.error(`Error validating exercise "${exercise.name}":`, error);
      return false;
    }
  }
}
