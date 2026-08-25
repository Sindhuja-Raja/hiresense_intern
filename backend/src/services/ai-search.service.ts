import { groqClient } from '../utils/groq-client';
import { AppError } from '../middleware/errorHandler';

export async function parseSearchQuery(query: string): Promise<Record<string, any>> {
  // Fail fast if no Groq key configured
  if (!groqClient.isEnabled()) {
    throw new AppError(
      'AI Search is unavailable: add GROQ_API_KEY to backend/.env. Get a free key at https://console.groq.com',
      503
    );
  }

  try {
    const systemPrompt =
      'You are an expert MongoDB query generator for a recruitment platform. ' +
      'Convert the user query into a valid MongoDB query object (JSON). ' +
      'Respond ONLY with a valid JSON object representing the MongoDB filter query — no markdown, no explanation.';

    const userPrompt =
      `Generate a MongoDB query to find candidates based on this natural language request: "${query}"\n\n` +
      `The database collection is 'users' and has the following schema fields for applicants:\n` +
      `- fullName: String\n` +
      `- location: String\n` +
      `- bio: String\n` +
      `- skills: Array of Strings\n` +
      `- experience: String (usually unstructured text detailing work history)\n` +
      `- education: String\n` +
      `- certifications: Array of Strings\n` +
      `- languages: Array of Strings\n` +
      `- summary: String\n\n` +
      `Guidelines:\n` +
      `- Use $regex with $options: 'i' for case-insensitive string matching (e.g., {"skills": {"$regex": "react", "$options": "i"}}).\n` +
      `- For arrays like skills, if multiple are required, you can use $all with regexes.\n` +
      `- DO NOT include 'role': 'applicant' in the query, the backend will automatically enforce it.\n` +
      `- Return ONLY the JSON query object. Example output: {"location": {"$regex": "texas", "$options": "i"}, "skills": {"$regex": "java", "$options": "i"}}`;

    const raw = await groqClient.complete(userPrompt, systemPrompt, 0.1);
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error: any) {
    if (error?.statusCode) throw error; // re-throw our AppErrors
    throw new AppError(
      `AI Search failed: ${error?.message || 'Unknown error from Groq API'}`,
      502
    );
  }
}
