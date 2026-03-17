import OpenAI from 'openai';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { Exercise } from '../types';
 
export class ExerciseEmbeddingService {
  private openai: OpenAI;
 
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
 
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Fix 5: updated from deprecated ada-002
        input: text,
      });
 
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
 
  async embedExercise(exercise: Exercise): Promise<void> {
    // Fix 4: guard against duplicate embeddings
    const { data: existing } = await supabaseAdmin
      .from('exercise_embeddings')
      .select('id')
      .eq('exercise_id', exercise.id)
      .single();
 
    if (existing) {
      console.log(`Embedding already exists for: ${exercise.name}, skipping.`);
      return;
    }
 
    // Fix 6: dedented template string for consistent embedding input
    const exerciseText = [
      `Exercise: ${exercise.name}`,
      `Difficulty: ${exercise.difficulty}`,
      `Description: ${exercise.description}`,
    ].join('\n');
 
    const embedding = await this.generateEmbedding(exerciseText);
 
    const { error } = await supabaseAdmin
      .from('exercise_embeddings')
      .insert({
        exercise_id: exercise.id,
        embedding: embedding,
      });
 
    if (error) {
      console.error('Error storing embedding:', error);
      throw error; // Fix 1: rethrow so callers are aware of failure
    }
 
    console.log(`Embedded exercise: ${exercise.name}`);
    // Fix 1: removed swallowing catch block — errors now propagate to caller
  }
 
  async embedAllExercises(): Promise<void> {
    // Fix 2: replaced broken subquery with two separate queries
    const { data: embedded, error: embeddedError } = await supabaseAdmin
      .from('exercise_embeddings')
      .select('exercise_id');
 
    if (embeddedError) {
      console.error('Error fetching existing embeddings:', embeddedError);
      throw embeddedError; // Fix 3: rethrow top-level errors
    }
 
    const embeddedIds = embedded?.map((e) => e.exercise_id) ?? [];
 
    const query = supabaseAdmin
      .from('exercises')
      .select('id, name, difficulty, description');
 
    if (embeddedIds.length > 0) {
      query.not('id', 'in', `(${embeddedIds.join(',')})`);
    }
 
    const { data: exercises, error } = await query;
 
    if (error) {
      console.error('Error fetching exercises:', error);
      throw error; // Fix 3: rethrow top-level errors
    }
 
    if (!exercises || exercises.length === 0) {
      console.log('No exercises to embed');
      return;
    }
 
    console.log(`Embedding ${exercises.length} exercises...`);
 
    const batchSize = 10;
    const failures: string[] = [];
 
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
 
      // Fix 1: track individual failures instead of silently swallowing them
      const results = await Promise.allSettled(
        batch.map((exercise) => this.embedExercise(exercise))
      );
 
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const name = batch[index].name;
          console.error(`Failed to embed exercise "${name}":`, result.reason);
          failures.push(name);
        }
      });
 
      if (i + batchSize < exercises.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
 
    if (failures.length > 0) {
      throw new Error(
        `Finished with ${failures.length} failed embedding(s): ${failures.join(', ')}`
      );
    }
 
    console.log('Finished embedding all exercises successfully');
  }
 
  async updateExerciseEmbedding(exerciseId: string): Promise<void> {
    try {
      const { data: exercise, error } = await supabaseAdmin
        .from('exercises')
        .select('id, name, difficulty, description')
        .eq('id', exerciseId)
        .single();
 
      if (error || !exercise) {
        console.error('Error fetching exercise:', error);
        return;
      }
 
      await supabaseAdmin
        .from('exercise_embeddings')
        .delete()
        .eq('exercise_id', exerciseId);
 
      await this.embedExercise(exercise);
    } catch (error) {
      console.error('Error updating exercise embedding:', error);
      throw error; // Fix 3: rethrow so caller knows the update failed
    }
  }
}
