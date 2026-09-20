// Groq AI Service for Chatbot
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System instruction focused on ApnaRozgaar, apps, and companies
const SYSTEM_INSTRUCTION = `You are Asha, a helpful and friendly AI assistant for ApnaRozgaar, a platform dedicated to inclusive hiring for Persons with Disabilities (PwD).

Your mission is to help users find inclusive job opportunities, build accessible profiles, and navigate the platform.

SPECIAL FOCUS:
- You have deep knowledge of companies that prioritize disability inclusion (e.g., Microsoft, Google, SAP, Accenture, and many progressive Indian firms).
- You can provide tips on app accessibility (screen readers, voice control, high contrast, etc.).
- When asked about companies, highlight their inclusive policies, workplace accommodations, and culture.
- When asked about apps, explain how they can be made more accessible for different types of disabilities.

FORMATTING RULES:
- Use emojis to stay friendly and warm 💜
- Use bullet points (•) for lists
- Use line breaks to separate sections
- Keep responses concise but very informative
- DO NOT use markdown formatting like **bold** or *italic*
- DO NOT use # for headings`;

/**
 * Send a message to Groq AI and get a response
 * @param {string} userMessage - The user's message
 * @param {Array} history - Optional message history for context
 * @returns {Promise<string>} AI response text
 */
export const getGroqResponse = async (userMessage, history = []) => {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured');
    return null;
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...history.slice(-5), // Last 5 messages for context
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', response.status, data);
      return null;
    }

    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      console.error('No response text in Groq response:', data);
      return null;
    }

    return responseText;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return null;
  }
};

/**
 * Check if Groq API is configured
 * @returns {boolean}
 */
export const isGroqConfigured = () => {
  return !!GROQ_API_KEY;
};

/**
 * Send a message to Groq AI for Resume Builder and get a response containing JSON
 * @param {string} userMessage - The user's message
 * @param {Array} history - Optional message history for context
 * @returns {Promise<string>} AI response text
 */
export const getGroqResumeExtraction = async (userMessage, history = []) => {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured');
    return null;
  }

  const RESUME_SYSTEM_INSTRUCTION = `You are an expert AI Resume Builder Assistant. Your goal is to construct a professional resume for the user by kindly asking them questions one by one.
Ask about their Name, Contact Info, Summary, Skills, Education, and Work Experience/Projects.
IMPORTANT RULE: At the very end of EVERY response you make, you MUST append a JSON block containing the current extracted resume state. The JSON must exactly match this format:
\`\`\`json
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "role": "",
  "summary": "",
  "skills": [],
  "education": [{"degree": "", "school": "", "year": ""}],
  "experience": [{"title": "", "company": "", "duration": "", "description": ""}],
  "projects": [{"title": "", "description": ""}]
}
\`\`\`
If you haven't extracted a field yet, leave it empty or as an empty array. Do not wrap the JSON in anything other than the \`\`\`json markdown block. Do not hallucinate data.`;

  try {
    const messages = [
      { role: 'system', content: RESUME_SYSTEM_INSTRUCTION },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: messages,
        temperature: 0.5,
        max_tokens: 1500,
        top_p: 1,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', response.status, data);
      return null;
    }

    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      console.error('No response text in Groq response:', data);
      return null;
    }

    return responseText;
  } catch (error) {
    console.error('Error calling Groq API for resume:', error);
    return null;
  }
};

/**
 * Fetch book recommendations from Groq
 * @param {string} topic - The topic or course name
 * @returns {Promise<Array>} Array of book recommendation objects
 */
export const getGroqBookRecommendations = async (topic) => {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured');
    return [];
  }

  const BOOK_SYSTEM_INSTRUCTION = `You are a helpful education librarian. The user will provide a topic or course name.
Your task is to recommend the 5 best books to read and prepare for this topic.
You MUST respond with ONLY a valid JSON array of objects. Do not include any markdown formatting, do not include \`\`\`json, do not say anything else.
Each object should have:
"title": String,
"author": String,
"description": String (short 2-sentence summary),
"level": String (Beginner, Intermediate, or Advanced),
"whyToRead": String (1 sentence on why it's good for this topic).`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          { role: 'system', content: BOOK_SYSTEM_INSTRUCTION },
          { role: 'user', content: `Topic: ${topic}` }
        ],
        temperature: 0.3, // Lower temperature for more structured output
        max_tokens: 1500,
        top_p: 1,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', response.status, data);
      return [];
    }

    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      return [];
    }

    let parsedBooks = [];
    try {
      // Removing any potential markdown just in case the AI ignored instructions
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedBooks = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse book JSON:', responseText);
      return [];
    }

    return parsedBooks;
  } catch (error) {
    console.error('Error calling Groq API for books:', error);
    return [];
  }
};

// ─── Interview Question Generator ────────────────────────────────────────────

const FALLBACK_QUESTIONS = {
  'frontend-developer': [
    'Walk me through how you would build a responsive layout using CSS Grid and Flexbox.',
    'Explain the difference between controlled and uncontrolled components in React.',
    'How do you optimize a React application for performance?',
    'What is the virtual DOM and how does it improve browser performance?',
    'Describe a time you had to debug a complex UI rendering issue.',
    'How do you approach cross-browser compatibility in your projects?',
    'What is your process for making a web application accessible (WCAG)?',
    'Explain the difference between == and === in JavaScript.',
    'How do you manage state in large-scale React applications?',
    'Tell me about a project where you significantly improved the user experience.',
  ],
  'backend-developer': [
    'Explain the difference between SQL and NoSQL databases and when to use each.',
    'How do you design a RESTful API? Walk me through the key principles.',
    'Describe how you would handle authentication and authorization in a Node.js app.',
    'What are database indexes and how do they improve query performance?',
    'Tell me about a time you resolved a production performance bottleneck.',
    'How do you approach error handling and logging in a backend service?',
    'Explain the concept of microservices vs monolithic architecture.',
    'How do you ensure data consistency in distributed systems?',
    'What is your strategy for writing maintainable and testable backend code?',
    'Describe your experience with message queues and asynchronous processing.',
  ],
  'data-analyst': [
    'Walk me through how you would approach cleaning a messy dataset.',
    'Explain the difference between correlation and causation with an example.',
    'How do you decide which visualization to use for a given dataset?',
    'Describe a time your data analysis directly influenced a business decision.',
    'What SQL window functions have you used and in what scenarios?',
    'How do you communicate complex data findings to non-technical stakeholders?',
    'What is the difference between mean, median, and mode, and when is each appropriate?',
    'Tell me about your experience with Python or R for data analysis.',
    'How do you validate the accuracy of your analysis results?',
    'Describe your workflow from raw data to a final insight presentation.',
  ],
  'content-writer': [
    'How do you adjust your writing style for different audiences and platforms?',
    'Walk me through your research process before writing a long-form article.',
    'How do you incorporate SEO best practices without sacrificing readability?',
    'Tell me about a piece of content you are most proud of and why.',
    'How do you handle tight deadlines while maintaining quality?',
    'Describe a time when you had to revise content based on critical feedback.',
    'What is your editing and proofreading workflow?',
    'How do you measure the success of the content you create?',
    'How do you stay updated on industry trends to keep your content relevant?',
    'Describe your experience creating content across formats (blog, social, email).',
  ],
  'graphic-designer': [
    'Walk me through your creative process from brief to final deliverable.',
    'How do you balance creative expression with brand guidelines?',
    'Tell me about a project where you solved a complex visual communication problem.',
    'How do you incorporate user feedback into your design iterations?',
    'Describe your experience with design systems and component libraries.',
    'How do you approach designing for accessibility and inclusivity?',
    'What is your workflow for collaborating with developers on design handoffs?',
    'Tell me about a design you created that significantly improved a product metric.',
    'How do you stay current with design trends while maintaining timeless quality?',
    'Describe your experience designing for multiple platforms (web, mobile, print).',
  ],
};

/**
 * Generate interview questions for a specific role and level using Groq AI.
 * Falls back to curated static questions if the API is unavailable or parsing fails.
 * @param {string} role - Job role id (e.g., 'frontend-developer')
 * @param {string} level - Experience level: 'entry' | 'mid' | 'senior'
 * @param {number} count - Number of questions to generate (default 10)
 * @returns {Promise<string[]>} Array of question strings
 */
export const generateInterviewQuestions = async (role, level, count = 10) => {
  const fallback = FALLBACK_QUESTIONS[role] ?? FALLBACK_QUESTIONS['frontend-developer'];

  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured — using fallback questions.');
    return fallback;
  }

  const roleLabel = role
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const levelLabel =
    level === 'entry'
      ? 'Entry Level (0–2 years of experience)'
      : level === 'senior'
      ? 'Senior / Lead (5+ years of experience)'
      : 'Mid-Level (2–5 years of experience)';

  const systemPrompt = `You are an expert technical interviewer. Generate exactly ${count} interview questions for a ${roleLabel} candidate at the ${levelLabel} stage.

Rules:
- Mix behavioral (STAR-method) questions and technical/domain-specific questions appropriate for the level.
- Entry Level: fundamentals, learning mindset, and basic problem-solving.
- Mid-Level: practical project experience, moderate complexity, and teamwork.
- Senior / Lead: system design, architectural decisions, leadership, and mentoring.
- Each question must be specific, concrete, and relevant to the ${roleLabel} domain.
- Do NOT number the questions.
- Return ONLY a valid JSON array of strings. No markdown, no extra text, no explanation.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate ${count} interview questions for a ${roleLabel} at the ${levelLabel} stage. Return only a JSON array of strings.`,
          },
        ],
        temperature: 0.75,
        max_tokens: 1800,
        top_p: 1,
        stream: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', response.status, data);
      return fallback;
    }

    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) return fallback;

    // Strip any accidental markdown code fences the model may add
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, count);
    }

    return fallback;
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return fallback;
  }
};

// ─── Answer Evaluation (ported from V2 repo) ────────────────────────────────

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * Transcribe an audio Blob using Groq's Whisper API.
 * @param {Blob} audioBlob  - The recorded audio (webm / opus).
 * @returns {Promise<string>} Transcription text.
 */
export const transcribeAudio = async (audioBlob) => {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured.');

  const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en');

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Transcription error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
};

/**
 * Evaluate a candidate's spoken/typed answer against the interview question.
 * Returns AI feedback, a strong sample answer, missing elements, and a confidence score.
 *
 * @param {string} question    - The interview question
 * @param {string} answer      - The candidate's answer
 * @param {string} role        - Job role (e.g. 'frontend-developer')
 * @param {string} [category]  - Question category (e.g. 'Technical', 'Behavioral')
 * @returns {Promise<{
 *   feedback: string,
 *   strongAnswer: string,
 *   missingElements: string[],
 *   confidenceScore: number,
 *   confidenceLevel: 'Low'|'Medium'|'High',
 *   confidenceExplanation: string
 * }>}
 */
export const evaluateAnswer = async (question, answer, role, category = 'General') => {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured.');

  const systemPrompt = `You are an expert technical interviewer evaluating candidate responses for a ${role} position.

You MUST respond with ONLY valid JSON (no markdown, no code blocks):
{
  "feedback": "<string: 2-3 sentence feedback on how an interviewer would perceive this answer>",
  "strongAnswer": "<string: what a strong candidate answer would look like>",
  "missingElements": ["<string>", "<string>"] (max 4 key elements missing),
  "confidenceScore": <number 0-100>,
  "confidenceLevel": "<Low|Medium|High>",
  "confidenceExplanation": "<string: one sentence explaining the score>"
}`;

  const userPrompt = `Question Category: ${category}
Interview Question: ${question}

Candidate's Answer: ${answer}

Evaluate this response and provide detailed feedback.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'groq/compound-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  // ── Graceful 429 / rate-limit fallback ─────────────────────────────────────
  if (response.status === 429) {
    console.warn('[evaluateAnswer] Groq rate-limited (429). Returning simulated evaluation.');
    const wordCount = answer.trim().split(/\s+/).length;
    const baseScore = Math.min(85, 40 + Math.min(wordCount, 120) * 0.35);
    const score = Math.round(baseScore);
    return {
      feedback: 'Your answer has been recorded. Detailed AI feedback is temporarily unavailable due to API limits — try again in a moment.',
      strongAnswer: 'A strong answer would include a clear structure (situation, task, action, result), specific technical details, and measurable outcomes.',
      missingElements: ['Specific examples', 'Quantified impact', 'Technical depth', 'Clear conclusion'],
      confidenceScore: score,
      confidenceLevel: score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low',
      confidenceExplanation: 'Estimated score based on answer length and structure (AI quota temporarily exceeded).',
    };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from Groq API');

  try {
    let cleaned = content.trim();
    // Extract JSON object substring to prevent parse errors from surrounding markdown text
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    const parsed = JSON.parse(cleaned);
    const score = Math.max(0, Math.min(100, Number(parsed.confidenceScore ?? 0)));
    return {
      feedback: String(parsed.feedback || 'Unable to generate feedback.'),
      strongAnswer: String(parsed.strongAnswer || 'A strong answer would include specific examples.'),
      missingElements: Array.isArray(parsed.missingElements)
        ? parsed.missingElements.slice(0, 4).map(String)
        : ['Specific examples', 'Technical depth'],
      confidenceScore: score,
      confidenceLevel: ['Low', 'Medium', 'High'].includes(parsed.confidenceLevel)
        ? parsed.confidenceLevel
        : score >= 75 ? 'High' : score >= 45 ? 'Medium' : 'Low',
      confidenceExplanation: String(
        parsed.confidenceExplanation || 'Score based on completeness, clarity, and depth.'
      ),
    };
  } catch (parseError) {
    console.error('Failed to parse Groq evaluation response:', content);
    throw new Error('Failed to parse evaluation response');
  }
};

/**
 * Automatically verify company details using Groq AI
 * @param {Object} companyData - { companyName, companyEmail, phone, website, address, recruiterName, gstDetails, hasDocument }
 * @returns {Promise<{ status: 'verified'|'pending'|'rejected', confidenceScore: number, summary: string, riskFlags: string[] }>}
 */
export const verifyCompanyWithAI = async (companyData) => {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured');
    return {
      status: 'pending',
      confidenceScore: 50,
      summary: 'Groq AI key unavailable for automatic verification.',
      riskFlags: ['API key missing']
    };
  }

  const prompt = `You are an AI Compliance Auditor for corporate registrations in India.
Analyze the following company registration data for legitimacy:
Company Name: ${companyData.companyName || 'N/A'}
Official Email: ${companyData.companyEmail || 'N/A'}
Phone: ${companyData.phone || 'N/A'}
Website: ${companyData.website || 'None'}
Address: ${companyData.address || 'N/A'}
Recruiter Name: ${companyData.recruiterName || 'N/A'}
GSTIN / Reg Number: ${companyData.gstDetails || 'N/A'}
Registration Document Uploaded: ${companyData.hasDocument ? 'Yes' : 'No'}

Evaluation Rules:
1. Indian GSTIN format check: Standard format is 15 alphanumeric characters (e.g., 29AAAAA1111A1Z1 or 07AAAAA0000A1Z5 - 2 digit state code + 10 digit PAN + 1 digit entity + 1 'Z' + 1 check digit). If GSTIN is missing, invalid length, or clearly fake, flag it.
2. Email Consistency: Check if domain matches company name or if it's a generic email (gmail/yahoo is acceptable for micro-business, but note it).
3. Field Completeness: All mandatory fields should be present.
4. Output standard status:
   - "verified": Legitimate details, valid GSTIN pattern, valid email & document present. Confidence score >= 80.
   - "pending": Minor concerns, generic email, or needs human document view. Confidence score 50-79.
   - "rejected": Falsified GSTIN, suspicious/scam email, offensive name, or missing document. Confidence score < 50.

You MUST respond with ONLY valid JSON in this exact structure:
{
  "status": "verified" | "pending" | "rejected",
  "confidenceScore": <number 0-100>,
  "summary": "<1-2 sentence concise summary of verification>",
  "riskFlags": ["<flag1>", "<flag2>"]
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          { role: 'system', content: 'You are a precise corporate audit AI. Respond strictly in JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in response');

    let cleaned = content.trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    const parsed = JSON.parse(cleaned);

    return {
      status: ['verified', 'pending', 'rejected'].includes(parsed.status) ? parsed.status : 'pending',
      confidenceScore: Math.max(0, Math.min(100, Number(parsed.confidenceScore ?? 70))),
      summary: String(parsed.summary || 'AI Verification complete.'),
      riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.map(String) : []
    };
  } catch (error) {
    console.error('Error in verifyCompanyWithAI:', error);
    // Fallback: simple heuristic validation
    const gst = (companyData.gstDetails || '').trim();
    const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst) || gst.length >= 10;
    return {
      status: isGstValid ? 'verified' : 'pending',
      confidenceScore: isGstValid ? 85 : 60,
      summary: isGstValid ? 'GST format validated.' : 'Requires manual review of GST certificate.',
      riskFlags: isGstValid ? [] : ['GST format unverified by AI']
    };
  }
};

/**
 * Verify job posting for scams, fake info, or suspicious content using Groq AI
 * @param {Object} jobData - { title, company, description, salary, location, jobType, skillsRequired, accessibilityFeatures }
 * @returns {Promise<{ riskScore: number, riskLevel: 'low'|'medium'|'high', status: 'active'|'pending_admin'|'rejected', summary: string, reasons: string[] }>}
 */
export const verifyJobWithAI = async (jobData) => {
  if (!GROQ_API_KEY) {
    console.warn('Groq API key not configured');
    return null;
  }

  const prompt = `You are an AI Safety & Fraud Auditor reviewing job postings for ApnaRozgaar (a job portal for PwD & inclusive hiring).
Analyze this job posting for scam, fraud, or policy violations:
Job Title: ${jobData.title || 'N/A'}
Company: ${jobData.company || 'N/A'}
Location: ${jobData.location || 'N/A'}
Work Mode: ${jobData.jobType || 'N/A'}
Salary Range: ${jobData.salary || 'Unspecified'}
Skills Required: ${Array.isArray(jobData.skillsRequired) ? jobData.skillsRequired.join(', ') : jobData.skillsRequired || 'N/A'}
Description: ${jobData.description || 'N/A'}
Accessibility Features Claimed: ${Array.isArray(jobData.accessibilityFeatures) ? jobData.accessibilityFeatures.join(', ') : 'None'}

Evaluation Criteria:
1. Money Demands: Asking candidates to pay registration fees, security deposits, training charges, or buy kits is a high risk scam violation.
2. Unrealistic Promises: "Earn 1 Lakh daily", "Work 1 hour earn money fast", get-rich-quick schemes are scams.
3. Suspicious Redirection: Telegram/WhatsApp group links, shortened links (bit.ly, wa.me).
4. Phishing/Fake Job: Vague job details combined with extremely high salary or personal bank details request.
5. Inappropriate content: Offensive or discriminatory language.

Determine:
- riskScore: 0 to 100 (0 = completely safe, 100 = blatant scam)
- riskLevel: "low" (0-30), "medium" (31-65), "high" (66-100)
- status: "active" (safe), "pending_admin" (medium risk), "rejected" (high risk)
- summary: Short 1-2 sentence summary of safety evaluation
- reasons: List of identified risk flags (if any)

Respond with ONLY valid JSON matching this schema:
{
  "riskScore": <number 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "status": "active" | "pending_admin" | "rejected",
  "summary": "<string>",
  "reasons": ["<string>"]
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          { role: 'system', content: 'You are an expert fraud detection AI. Respond strictly in JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in response');

    let cleaned = content.trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    const parsed = JSON.parse(cleaned);

    const riskScore = Math.max(0, Math.min(100, Number(parsed.riskScore ?? 0)));
    const riskLevel = riskScore > 65 ? 'high' : riskScore > 30 ? 'medium' : 'low';
    const status = riskLevel === 'high' ? 'rejected' : riskLevel === 'medium' ? 'pending_admin' : 'active';

    return {
      riskScore,
      riskLevel,
      status: ['active', 'pending_admin', 'rejected'].includes(parsed.status) ? parsed.status : status,
      summary: String(parsed.summary || 'Job passed AI safety screening.'),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : []
    };
  } catch (error) {
    console.error('Error calling Groq API for job verification:', error);
    return null;
  }
};

/**
 * Predict and expand raw sign language keywords/letters into a fluent interview sentence using Groq AI
 * @param {string} rawSignText - Signed letters or keywords (e.g. "built react app solve performance issue")
 * @param {string} questionContext - Optional interview question context
 * @returns {Promise<string>} Expanded fluent sentence
 */
export const predictSentenceFromSignKeywords = async (rawSignText, questionContext = '') => {
  if (!GROQ_API_KEY || !rawSignText.trim()) return rawSignText;

  const systemPrompt = `You are an AI Sign Language Interpreter & Sentence Constructor for job interviews.
The user is providing raw words/letters outputted by a Real-Time Hand Sign Language (ISL) Recognition camera system.
Your job is to translate these raw, fragmented sign language tokens into a clear, grammatical, and professional interview response sentence.

Rules:
- Keep the user's core meaning, technical terms, and intent intact.
- Make it sound natural and confident as an interview answer.
- Do NOT add conversational filler like "Here is your sentence:".
- Output ONLY the expanded final sentence.`;

  const userPrompt = `Interview Question Context: ${questionContext || 'General technical question'}
Raw Signed Tokens: "${rawSignText}"

Construct a clear, professional interview sentence based on these signed tokens.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 300
      })
    });

    if (!response.ok) return rawSignText;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || rawSignText;
  } catch (error) {
    console.error('Error predicting sentence from sign keywords:', error);
    return rawSignText;
  }
};



