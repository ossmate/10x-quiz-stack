/**
 * Constructs a detailed prompt for AI quiz generation
 * This prompt ensures the AI returns structured, valid quiz content
 *
 * @param userPrompt - The user's description of the quiz to generate
 * @returns Complete prompt for the AI model
 */
export function constructQuizGenerationPrompt(userPrompt: string): string {
  return `You are an expert quiz creator. Generate a high-quality quiz based on the following user request:

USER REQUEST: "${userPrompt}"

INSTRUCTIONS:
1. Create a quiz with a clear, descriptive title
2. Write a brief description (1-2 sentences) explaining what the quiz covers
3. Generate 5-10 questions that thoroughly test knowledge on the topic
4. For each question:
   - Write a clear, unambiguous question
   - Provide exactly 4 answer options
   - Mark exactly ONE option as correct
   - Optionally include a brief explanation of why the correct answer is right
5. Ensure questions progress from easier to more challenging
6. Use varied question types (definitions, applications, scenarios)
7. Avoid ambiguous or trick questions

REQUIRED OUTPUT FORMAT (valid JSON):
{
  "title": "Quiz Title Here",
  "description": "Brief description of the quiz topic and scope",
  "questions": [
    {
      "content": "Question text here?",
      "explanation": "Optional explanation of the correct answer",
      "options": [
        { "content": "First option", "is_correct": false },
        { "content": "Second option", "is_correct": true },
        { "content": "Third option", "is_correct": false },
        { "content": "Fourth option", "is_correct": false }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text or markdown
- Ensure exactly ONE option per question has "is_correct": true
- Each question must have exactly 4 options
- Keep questions concise but clear
- Make sure the quiz is appropriate and educational

Generate the quiz now:`;
}

/**
 * System message for the AI model
 * Sets the context and behavior expectations
 */
export const QUIZ_GENERATION_SYSTEM_MESSAGE = `You are a professional educational content creator specializing in creating high-quality quizzes. Your quizzes are:
- Accurate and well-researched
- Educational and engaging
- Fair and unambiguous
- Properly structured with varied difficulty
- Free from bias or inappropriate content

Always respond with valid JSON only, following the exact schema provided in the user's prompt.`;
