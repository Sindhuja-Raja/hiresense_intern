/**
 * AI Chat Service
 * 
 * Handles communication with the Gemini AI API.
 * The avatar acts as an HR interviewer that:
 * - Asks job-specific interview questions
 * - Analyzes tone and communication
 * - Provides scores and final verdict (accept/reject)
 */

export type JobRole = 
  | 'software-engineer'
  | 'data-analyst'
  | 'product-manager'
  | 'marketing-manager'
  | 'sales-representative'
  | 'hr-specialist'
  | 'customer-support';

export interface InterviewScore {
  tone: number; // 1-10
  communication: number; // 1-10
  content: number; // 1-10
  overall: number; // 1-10
  verdict: 'ACCEPT' | 'REJECT' | 'MAYBE';
  feedback: string;
}

const JOB_QUESTIONS: Record<JobRole, string[]> = {
  'software-engineer': [
    "Can you describe a challenging technical problem you solved recently?",
    "How do you approach debugging a complex issue in production?",
    "Tell me about a time you had to learn a new technology quickly.",
    "How do you handle code reviews and feedback from teammates?",
    "Describe your experience with agile development methodologies."
  ],
  'data-analyst': [
    "How do you approach cleaning and preparing messy datasets?",
    "Describe a time when your analysis led to a significant business decision.",
    "What tools and techniques do you use for data visualization?",
    "How do you communicate complex findings to non-technical stakeholders?",
    "Tell me about a time you found an unexpected insight in data."
  ],
  'product-manager': [
    "How do you prioritize features when you have limited resources?",
    "Describe a product you launched and the challenges you faced.",
    "How do you gather and incorporate user feedback?",
    "Tell me about a time you had to say no to a stakeholder request.",
    "How do you measure the success of a product?"
  ],
  'marketing-manager': [
    "Describe a successful marketing campaign you led.",
    "How do you measure ROI on marketing initiatives?",
    "Tell me about a time you had to pivot your marketing strategy.",
    "How do you stay current with marketing trends?",
    "Describe your experience with digital vs traditional marketing."
  ],
  'sales-representative': [
    "Tell me about your most challenging sale and how you closed it.",
    "How do you handle rejection in sales?",
    "Describe your approach to building relationships with clients.",
    "How do you stay motivated during slow periods?",
    "Tell me about a time you exceeded your sales targets."
  ],
  'hr-specialist': [
    "How do you handle conflicts between employees?",
    "Describe your approach to conducting performance reviews.",
    "How do you ensure diversity and inclusion in hiring?",
    "Tell me about a difficult employee situation you handled.",
    "How do you stay current with employment laws and regulations?"
  ],
  'customer-support': [
    "How do you handle an angry or frustrated customer?",
    "Describe a time you went above and beyond for a customer.",
    "How do you prioritize multiple support tickets?",
    "Tell me about a complex issue you resolved for a customer.",
    "How do you maintain a positive attitude during difficult calls?"
  ]
};

const SYSTEM_PROMPT = `You are a professional HR interviewer named Sarah conducting a thorough job interview.

YOUR ROLE:
1. Conduct a realistic interview with 5-10 questions
2. Ask follow-up questions based on the candidate's answers (like a real interviewer)
3. Analyze TONE (confidence, enthusiasm, professionalism) and COMMUNICATION (clarity, structure, articulation)
4. Be professional but friendly

INTERVIEW FLOW (5-10 questions total):
1. Greeting + ask them to introduce themselves
2. Ask about their relevant experience for the role
3. Technical/role-specific question based on their background
4. Behavioral question ("Tell me about a time when...")
5. Problem-solving or situational question
6. Follow-up questions based on their previous answers
7. Questions about teamwork/collaboration
8. Question about challenges/failures and what they learned
9. Why they want this role/company
10. Any questions they have for you

IMPORTANT RULES:
- Keep each response SHORT (1-2 sentences acknowledgment + next question)
- Ask FOLLOW-UP questions based on what they said - don't just move to generic questions
- If their answer is vague, ask them to elaborate
- If they mention something interesting, dig deeper
- Track how many questions you've asked

DO NOT provide evaluation until explicitly asked or after 8+ questions have been answered.

WHEN USER SAYS "evaluate", "final score", "how did I do" OR you've asked 8+ questions:
Provide evaluation in this EXACT format:
---EVALUATION---
TONE SCORE: [1-10]/10
COMMUNICATION SCORE: [1-10]/10  
CONTENT SCORE: [1-10]/10
OVERALL: [1-10]/10
VERDICT: [ACCEPT/REJECT/MAYBE]
FEEDBACK: [3-4 sentences of detailed constructive feedback mentioning specific things they said]
---END---`;

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

class AIService {
  private apiKey: string = import.meta.env.VITE_GEMINI_API_KEY || '';
  private conversationHistory: ChatMessage[] = [];
  private currentJobRole: JobRole = 'software-engineer';
  private questionsAsked: number = 0;

  constructor() {
    this.conversationHistory = [];
    console.log('Gemini API Key loaded:', this.apiKey ? 'Yes (length: ' + this.apiKey.length + ')' : 'No');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setJobRole(role: JobRole) {
    this.currentJobRole = role;
    this.questionsAsked = 0;
    this.conversationHistory = [];
  }

  getJobRole(): JobRole {
    return this.currentJobRole;
  }

  getAvailableRoles(): { value: JobRole; label: string }[] {
    return [
      { value: 'software-engineer', label: 'Software Engineer' },
      { value: 'data-analyst', label: 'Data Analyst' },
      { value: 'product-manager', label: 'Product Manager' },
      { value: 'marketing-manager', label: 'Marketing Manager' },
      { value: 'sales-representative', label: 'Sales Representative' },
      { value: 'hr-specialist', label: 'HR Specialist' },
      { value: 'customer-support', label: 'Customer Support' }
    ];
  }

  async getResponse(userMessage: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const response = await this.callGemini(userMessage);
    this.questionsAsked++;

    this.conversationHistory.push({
      role: 'model',
      parts: [{ text: response }]
    });

    return response;
  }

  async requestEvaluation(): Promise<string> {
    return this.getResponse("Please provide my final evaluation with scores for tone, communication, and your verdict.");
  }

  parseEvaluation(response: string): InterviewScore | null {
    if (!response.includes('---EVALUATION---')) {
      return null;
    }

    try {
      const toneMatch = response.match(/TONE SCORE:\s*(\d+)/i);
      const commMatch = response.match(/COMMUNICATION SCORE:\s*(\d+)/i);
      const contentMatch = response.match(/CONTENT SCORE:\s*(\d+)/i);
      const overallMatch = response.match(/OVERALL:\s*(\d+)/i);
      const verdictMatch = response.match(/VERDICT:\s*(ACCEPT|REJECT|MAYBE)/i);
      const feedbackMatch = response.match(/FEEDBACK:\s*(.+?)(?:---END---|$)/is);

      if (toneMatch && commMatch && verdictMatch) {
        return {
          tone: parseInt(toneMatch[1]),
          communication: parseInt(commMatch[1]),
          content: contentMatch ? parseInt(contentMatch[1]) : 7,
          overall: overallMatch ? parseInt(overallMatch[1]) : 7,
          verdict: verdictMatch[1].toUpperCase() as 'ACCEPT' | 'REJECT' | 'MAYBE',
          feedback: feedbackMatch ? feedbackMatch[1].trim() : 'Good interview performance.'
        };
      }
    } catch (e) {
      console.error('Failed to parse evaluation:', e);
    }
    return null;
  }

  private async callGemini(userMessage: string, retryCount = 0): Promise<string> {
    const MAX_RETRIES = 3;
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      
      // Get job-specific context
      const jobQuestions = JOB_QUESTIONS[this.currentJobRole];
      const roleLabel = this.getAvailableRoles().find(r => r.value === this.currentJobRole)?.label;
      
      const contextPrompt = `${SYSTEM_PROMPT}

JOB ROLE BEING INTERVIEWED FOR: ${roleLabel}

SAMPLE QUESTIONS FOR THIS ROLE (use these as inspiration, but follow up on candidate's answers):
${jobQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

QUESTIONS ANSWERED BY CANDIDATE SO FAR: ${this.questionsAsked}
TARGET: Ask 5-10 questions total before evaluation
${this.questionsAsked >= 8 ? 'NOTE: You have asked enough questions (8+). You can wrap up and provide evaluation now, or ask 1-2 more if needed.' : ''}
${this.questionsAsked >= 5 && this.questionsAsked < 8 ? 'NOTE: You can continue asking questions or wrap up if the candidate seems ready.' : ''}
${this.questionsAsked < 5 ? 'NOTE: Continue the interview - ask follow-up questions based on their answers.' : ''}

FULL CONVERSATION HISTORY:
${this.conversationHistory.map(m => `${m.role === 'user' ? 'Candidate' : 'Sarah'}: ${m.parts[0].text}`).join('\n')}

Candidate's latest response: ${userMessage}

Remember: Ask a FOLLOW-UP question based on what they just said, or move to the next interview topic. Be like a real interviewer who listens and responds to what the candidate actually says.

Respond as Sarah:`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: contextPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };

      console.log('Calling Gemini API...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Gemini API error response:', data);
        const errorMsg = data.error?.message || 'Unknown API error';
        
        // Check if it's a rate limit error
        if (response.status === 429 || errorMsg.includes('quota') || errorMsg.includes('rate')) {
          if (retryCount < MAX_RETRIES) {
            // Extract wait time from error message or use exponential backoff
            const waitMatch = errorMsg.match(/retry in (\d+\.?\d*)/i);
            const waitTime = waitMatch ? parseFloat(waitMatch[1]) * 1000 : (retryCount + 1) * 5000;
            
            console.log(`Rate limited. Waiting ${waitTime/1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
            
            await this.sleep(waitTime);
            return this.callGemini(userMessage, retryCount + 1);
          }
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        
        throw new Error(`Gemini API: ${errorMsg}`);
      }
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        console.log('Gemini response received successfully');
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  getGreeting(): string {
    const roleLabel = this.getAvailableRoles().find(r => r.value === this.currentJobRole)?.label;
    return `Hello! Welcome to your interview for the ${roleLabel} position. I'm Sarah, and I'll be conducting your interview today. I'll be evaluating your responses for tone, communication, and content. Let's begin! Could you please introduce yourself and tell me a bit about your background?`;
  }

  resetConversation() {
    this.conversationHistory = [];
    this.questionsAsked = 0;
  }
}

// Export singleton instance
export const aiService = new AIService();
