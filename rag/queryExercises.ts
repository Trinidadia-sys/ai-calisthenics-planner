import OpenAI from 'openai';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { Exercise, ExperienceLevel } from '../types';

export class ExerciseQueryService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async findSimilarExercises(
    query: string,
    difficulty?: ExperienceLevel,
    limit: number = 20
  ): Promise<Exercise[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      let vectorQuery = (supabaseAdmin as any)
        .rpc('find_similar_exercises', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit
        });

      if (difficulty) {
        vectorQuery = vectorQuery.eq('difficulty', difficulty);
      }

      const { data, error } = await vectorQuery;

      if (error) {
        console.error('Error querying exercises:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in findSimilarExercises:', error);
      return [];
    }
  }

  async getExercisesByDifficulty(difficulty: ExperienceLevel, limit: number = 50): Promise<Exercise[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('exercises')
        .select('*')
        .eq('difficulty', difficulty)
        .limit(limit);

      if (error) {
        console.error('Error fetching exercises by difficulty:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExercisesByDifficulty:', error);
      return [];
    }
  }

  async getExercisesForWorkout(
    experienceLevel: ExperienceLevel,
    muscleGroups?: string[],
    trainingStyle?: string,
    limit: number = 30
  ): Promise<Exercise[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('exercises')
        .select('*')
        .eq('difficulty', experienceLevel)
        .limit(limit);

      if (error) {
        console.error('Error fetching exercises:', error);
        return [];
      }

      if (!data || data.length < 5) {
        const { data: allData, error: allError } = await supabaseAdmin
          .from('exercises')
          .select('*')
          .limit(limit);

        if (allError) {
          console.error('Error fetching all exercises:', allError);
          return [];
        }

        return (allData as Exercise[]) || [];
      }

      return data as Exercise[];
    } catch (error) {
      console.error('Error in getExercisesForWorkout:', error);
      return [];
    }
  }

  async searchExercises(searchTerm: string, limit: number = 20): Promise<Exercise[]> {
    try {
      const vectorResults = await this.findSimilarExercises(searchTerm, undefined, limit);

      if (vectorResults.length < 5) {
        const { data: textResults, error } = await supabaseAdmin
          .from('exercises')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
          .limit(limit) as { data: Exercise[] | null, error: any };

        if (!error && textResults) {
          const combined: Exercise[] = [...vectorResults];
          for (const exercise of textResults) {
            if (!combined.find((e: Exercise) => e.id === exercise.id)) {
              combined.push(exercise);
            }
          }
          return combined.slice(0, limit);
        }
      }

      return vectorResults;
    } catch (error) {
      console.error('Error in searchExercises:', error);
      return [];
    }
  }
}