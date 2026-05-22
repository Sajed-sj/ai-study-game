// src/services/openai.js

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

const getApiKey = () => import.meta.env.VITE_OPENROUTER_API_KEY;

const callOpenRouter = async (messages, maxTokens = 1000) => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_openrouter_key_here') return null;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Study Game',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};

export const generateQuizFromText = async (text, numQuestions = 10, difficulty = 'medium') => {
  const difficultyInstructions = {
    easy: 'basic recall of specific terms and definitions found in the text',
    medium: 'understanding of specific concepts, values, and processes described in the text',
    hard: 'deep knowledge of multiple technical details combined from the text',
    boss: 'expert-level mastery combining multiple specific technical concepts with tricky distractors',
  };

  // نحذف أسطر فارغة ونكتشف الموضوع من أول 200 حرف
  const cleanText = text.replace(/\n{3,}/g, '\n\n').trim();
  const topicHint = cleanText.substring(0, 200);

  const systemPrompt = `You are a technical exam generator. You extract quiz questions EXCLUSIVELY from the provided study material.

ABSOLUTE RULES:
- NEVER ask "what is the primary focus" or "how does the author structure" or any meta question about the text
- ONLY ask about SPECIFIC facts explicitly stated in the text: exact numbers, protocol names, commands, states, timers, packet types, definitions, steps
- Every question must be answerable using ONLY the provided text
- Wrong options must use plausible values from the same domain, not obviously wrong
- Return ONLY raw JSON array, no markdown fences, no explanation`;

  const userPrompt = `Study material (topic detected from start: "${topicHint}..."):
"""
${cleanText.substring(0, 11000)}
"""

Generate exactly ${numQuestions} technical questions at ${difficulty.toUpperCase()} difficulty (${difficultyInstructions[difficulty]}).

JSON format (return ONLY this, nothing else):
[
  {
    "id": 1,
    "question": "Specific technical question referencing content from the text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "The text states: [specific reference to the text content]",
    "topic": "Specific subtopic",
    "difficulty": "${difficulty}"
  }
]`;

  try {
    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 3000);

    if (!content) {
      console.warn('No OpenRouter key found — using demo questions');
      return generateDemoQuestions(numQuestions);
    }

    // تنظيف الـ response من markdown لو وجد
    const cleaned = content.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('OpenRouter quiz generation error:', error);
    return generateDemoQuestions(numQuestions);
  }
};

export const generateExplanation = async (question, userAnswer, correctAnswer, context = '') => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'your_openrouter_key_here') {
    return `The correct answer is "${correctAnswer}". You selected "${userAnswer}". Review the lesson material to understand this concept better.`;
  }

  try {
    const content = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a helpful tutor. Give brief, encouraging explanations under 80 words.',
      },
      {
        role: 'user',
        content: `Question: "${question}"
Student answered: "${userAnswer}"
Correct answer: "${correctAnswer}"
${context ? `Study material context: ${context}` : ''}

Explain why the correct answer is right in 2-3 encouraging sentences.`,
      },
    ], 200);

    return content || `The correct answer is "${correctAnswer}". You selected "${userAnswer}". Take time to review this concept — you're making progress!`;
  } catch (error) {
    console.error('OpenRouter explanation error:', error);
    return `The correct answer is "${correctAnswer}". You selected "${userAnswer}". Take time to review this concept — you're making progress!`;
  }
};

// Demo questions when no API key is available
const generateDemoQuestions = (count) => {
  const demoPool = [
    {
      id: 1,
      question: "What is the primary purpose of machine learning?",
      options: [
        "To program computers with explicit rules",
        "To enable computers to learn from data without being explicitly programmed",
        "To create faster processors",
        "To replace human intelligence entirely"
      ],
      correct: 1,
      explanation: "Machine learning enables computers to learn patterns from data and make decisions without explicit programming.",
      topic: "Machine Learning",
      difficulty: "medium"
    },
    {
      id: 2,
      question: "Which of the following is a supervised learning algorithm?",
      options: ["K-means clustering", "Principal Component Analysis", "Linear Regression", "Autoencoders"],
      correct: 2,
      explanation: "Linear Regression is a supervised learning algorithm that learns from labeled training data.",
      topic: "Algorithms",
      difficulty: "medium"
    },
    {
      id: 3,
      question: "What does 'neural network' refer to?",
      options: [
        "A physical network of computers",
        "A computational model inspired by the human brain",
        "A type of database",
        "An internet security protocol"
      ],
      correct: 1,
      explanation: "Neural networks are computational models inspired by biological neural networks in animal brains.",
      topic: "Neural Networks",
      difficulty: "easy"
    },
    {
      id: 4,
      question: "What is overfitting in machine learning?",
      options: [
        "When a model performs well on training data but poorly on new data",
        "When a model is trained too slowly",
        "When the dataset is too large",
        "When the model architecture is too simple"
      ],
      correct: 0,
      explanation: "Overfitting occurs when a model learns training data too specifically and fails to generalize.",
      topic: "Model Training",
      difficulty: "medium"
    },
    {
      id: 5,
      question: "What is gradient descent?",
      options: [
        "A skiing technique",
        "A data preprocessing method",
        "An optimization algorithm that minimizes a loss function",
        "A type of neural network layer"
      ],
      correct: 2,
      explanation: "Gradient descent minimizes a model's loss function by iteratively moving in the direction of steepest descent.",
      topic: "Optimization",
      difficulty: "medium"
    },
  ];

  const shuffled = [...demoPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, demoPool.length)).map((q, i) => ({ ...q, id: i + 1 }));
};