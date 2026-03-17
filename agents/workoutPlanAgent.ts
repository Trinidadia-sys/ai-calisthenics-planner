import OpenAI from 'openai';
import { ExperienceLevel, GeneratedWorkoutPlan, Exercise } from '../types';

const LEVEL_ORDER: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class WorkoutPlanAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateWorkoutPlan(
    experienceLevel: ExperienceLevel,
    trainingFrequency: number,
    availableExercises: Exercise[],
    preferences?: string[]
  ): Promise<GeneratedWorkoutPlan> {
    let aiError: unknown = null;

    try {
      const exerciseContext = availableExercises
        .map(exercise => `- ${exercise.name} (${exercise.difficulty}): ${exercise.description}`)
        .join('\n');

      // If a goal was passed in preferences, include it in the prompt
      const goalInstruction = preferences && preferences.length > 0
        ? `- The user's primary goal is "${preferences[0]}" — prioritise exercises that match this goal`
        : '';

      const systemPrompt = `You are an expert calisthenics trainer. Create a personalized workout plan based on the user's experience level and preferences.

      Available exercises:
      ${exerciseContext}

      Generate a structured JSON workout plan with the following format:
      {
        "week_plan": [
          {
            "day": "Day Name (e.g., 'Upper Body', 'Lower Body', 'Rest')",
            "exercises": [
              {
                "name": "exercise name from available list",
                "sets": number,
                "reps": number,
                "video": "youtube video link if available",
                "difficulty": "Beginner|Intermediate|Advanced|Expert"
              }
            ]
          }
        ]
      }

      Guidelines:
      - Create exactly ${trainingFrequency} workout days per week
      - Include rest days
      - Progress difficulty appropriately for ${experienceLevel} level
      - Balance push/pull/legs movements
      - Each workout should have 4-6 exercises
      - Sets: 3-4 for beginners, 4-5 for intermediate/advanced
      - Reps: 8-15 depending on exercise and difficulty
      - Use only exercises from the available list
      - Include proper warm-up and cool-down recommendations
      - IMPORTANT: Each exercise must appear at most once per day — no repeats within the same workout day
      - Vary exercises across different days of the week where possible
      ${goalInstruction}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate a ${trainingFrequency}-day weekly workout plan for a ${experienceLevel} level athlete${
              preferences?.length ? ` focused on: ${preferences.join(', ')}` : ''
            }.`,
          },
        ],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const cleaned = content.replace(/```json\n?|```/g, '').trim();

      let workoutPlan: GeneratedWorkoutPlan;
      try {
        workoutPlan = JSON.parse(cleaned);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }

      if (!workoutPlan.week_plan || !Array.isArray(workoutPlan.week_plan)) {
        throw new Error('Invalid workout plan structure: missing week_plan array');
      }

      for (const day of workoutPlan.week_plan) {
        if (!day.day || !Array.isArray(day.exercises)) {
          throw new Error(`Invalid day structure in workout plan: ${JSON.stringify(day)}`);
        }
      }

      // Safety net: deduplicate exercises within each day by name
      workoutPlan.week_plan = workoutPlan.week_plan.map(day => ({
        ...day,
        exercises: day.exercises.filter((exercise, index, self) =>
          index === self.findIndex(e => e.name.toLowerCase() === exercise.name.toLowerCase())
        ),
      }));

      return workoutPlan;

    } catch (error) {
      aiError = error;
      console.error('AI workout generation failed, falling back to basic plan:', aiError);
      return this.generateFallbackPlan(experienceLevel, trainingFrequency, availableExercises);
    }
  }

  private generateFallbackPlan(
    experienceLevel: ExperienceLevel,
    trainingFrequency: number,
    availableExercises: Exercise[]
  ): GeneratedWorkoutPlan {
    const maxIndex = LEVEL_ORDER.indexOf(experienceLevel);
    const filteredExercises = availableExercises.filter(
      ex => LEVEL_ORDER.indexOf(ex.difficulty) <= maxIndex
    );

    const daysPerWeek = Math.min(trainingFrequency, 7);
    const shuffled = shuffle(filteredExercises);
    let pointer = 0;

    const getNextExercises = (count: number): Exercise[] => {
      const result: Exercise[] = [];
      const usedThisDay = new Set<string>();

      while (result.length < count) {
        if (pointer >= shuffled.length) {
          pointer = 0;
          shuffled.splice(0, shuffled.length, ...shuffle(filteredExercises));
        }
        const exercise = shuffled[pointer++];
        if (usedThisDay.has(exercise.name.toLowerCase())) continue;
        usedThisDay.add(exercise.name.toLowerCase());
        result.push(exercise);
      }

      return result;
    };

    const weekPlan = [];

    for (let i = 0; i < daysPerWeek; i++) {
      const dayExercises = getNextExercises(4);
      weekPlan.push({
        day: `Day ${i + 1}`,
        exercises: dayExercises.map(exercise => ({
          name: exercise.name,
          sets: experienceLevel === 'Beginner' ? 3 : 4,
          reps: experienceLevel === 'Beginner' ? 10 : 12,
          video: exercise.video_url,
          difficulty: exercise.difficulty,
        })),
      });
    }

    while (weekPlan.length < 7) {
      weekPlan.push({ day: 'Rest', exercises: [] });
    }

    return { week_plan: weekPlan };
  }
}