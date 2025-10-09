/**
 * Extracts and cleans JSON from AI responses
 * Handles common issues like markdown code blocks and formatting problems
 */

/**
 * Extracts JSON from markdown code blocks if present
 *
 * @param text - Raw text that might contain JSON
 * @returns Extracted JSON string
 */
export function extractJSONFromMarkdown(text: string): string {
  // Try to extract JSON from markdown code blocks (```json ... ``` or ``` ... ```)
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // If no code block, return the original text trimmed
  return text.trim();
}

/**
 * Cleans and fixes common JSON formatting issues from AI responses
 *
 * @param jsonString - JSON string to clean
 * @returns Cleaned JSON string
 */
export function cleanJSONString(jsonString: string): string {
  let cleaned = jsonString;

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // Remove BOM if present
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.slice(1);
  }

  // Try to fix common issues with unescaped characters in strings
  // This is a simple fix - for production you might need more robust handling

  return cleaned;
}

/**
 * Attempts to parse JSON with multiple strategies
 *
 * @param text - Text containing JSON
 * @returns Parsed JSON object
 * @throws Error if JSON cannot be parsed
 */
export function parseJSONRobustly(text: string): unknown {
  // Strategy 1: Extract from markdown and parse
  try {
    const extracted = extractJSONFromMarkdown(text);
    const cleaned = cleanJSONString(extracted);
    return JSON.parse(cleaned);
  } catch (error1) {
    // Strategy 2: Try to find JSON object boundaries
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Strategy 3: Try to find and parse array
      try {
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          return JSON.parse(arrayMatch[0]);
        }
      } catch {
        // All strategies failed
        throw new Error(`Failed to parse JSON: ${error1 instanceof Error ? error1.message : "Unknown error"}`);
      }
    }
  }

  throw new Error("Could not find valid JSON in response");
}
