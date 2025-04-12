import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not found. OpenAI features will not work.");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development"
});

// Helper to determine if OpenAI is properly configured
const isConfigured = () => !!process.env.OPENAI_API_KEY;

interface ChatCompletionResponse {
  text: string;
  isTripleChecked?: boolean;
  error?: boolean; // Added error flag
}

/**
 * Get a chat completion from OpenAI
 */
export async function getChatCompletion(
  prompt: string,
  language: string = "english",
  fileUrls?: string[],
  tripleCheck: boolean = false,
  userIsPremium: boolean = false
): Promise<ChatCompletionResponse> {
  if (!isConfigured()) {
    return { 
      text: "I'm not fully configured. Please add an OpenAI API key to enable my full capabilities.",
      isTripleChecked: false
    };
  }

  try {
    // Create system prompt with proper language and capabilities
    let systemPrompt = `You are Desi AI, a friendly and helpful AI assistant with an Indian personality. 
Respond in ${language} language.`;

    if (language === "hindi") {
      systemPrompt += " आप हिंदी में उत्तर देंगे।";
    } else if (language === "hinglish") {
      systemPrompt += " You should mix Hindi and English (Hinglish) in your responses in a natural way.";
    }

    systemPrompt += `
- If asked about who made you, respond: "I was made by an anonymous developer—he's also a YouTuber named FIREGAMERHERO"
- When responding, be polite, helpful, and provide complete answers
- Include relevant cultural context when appropriate, especially related to Indian culture
- If you don't know the answer, admit it rather than making things up`;

    // For premium users, enable triple-checking
    if (tripleCheck || userIsPremium) {
      const verificationCount = userIsPremium ? 3 : (tripleCheck ? 2 : 1);
      systemPrompt += `
- You have ENHANCED VERIFICATION enabled (${verificationCount}x check).
- Take extra time to verify answers through multiple reasoning paths:
  1. Check factual accuracy and sources
  2. Verify logical consistency and completeness
  3. Consider edge cases and potential issues
- For each response, include internal verification steps
- Mark the confidence level for premium users`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];

    // Include file content if provided
    if (fileUrls && fileUrls.length > 0) {
      messages.push({
        role: "user",
        content: `These files were uploaded for reference: ${fileUrls.join(", ")}. Please analyze them if needed.`
      });
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 2048
    });

    return {
      text: response.choices[0].message.content || "Sorry, I couldn't generate a response.",
      isTripleChecked: tripleCheck
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    const errorMessage = error.response?.data?.error?.message || 
                        error.message || 
                        "An unexpected error occurred";
    return {
      text: `I apologize, but I encountered an error: ${errorMessage}. Please try again in a moment.`,
      isTripleChecked: false,
      error: true // Added error flag
    };
  }
}

/**
 * Refine a chat response for clarity based on feedback
 */
export async function refineChatResponse(
  originalMessage: string,
  followUpMessage: string,
  language: string = "english"
): Promise<ChatCompletionResponse> {
  if (!isConfigured()) {
    return { 
      text: "I'm not fully configured. Please add an OpenAI API key to enable my full capabilities."
    };
  }

  try {
    const systemPrompt = `You are Desi AI, a friendly and helpful AI assistant.
You previously responded with: "${originalMessage}"
The user is asking for clarification with: "${followUpMessage}"

Please provide a clearer, simpler explanation in ${language} language. Address the specific concerns or confusion the user expressed.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: followUpMessage }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    return {
      text: response.choices[0].message.content || "Sorry, I couldn't generate a clarification."
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      text: "Sorry, I encountered an error while generating a clarification. Please try again later."
    };
  }
}

/**
 * Generate an image using DALL-E
 */
export async function generateImage(prompt: string): Promise<{ url: string }> {
  if (!isConfigured()) {
    return { 
      url: "https://via.placeholder.com/1024x1024?text=OpenAI+API+Key+Not+Configured"
    };
  }

  try {
    // Add Indian themed elements to prompt if not specified
    let enhancedPrompt = prompt;
    if (!prompt.toLowerCase().includes("indian") && 
        !prompt.toLowerCase().includes("india") && 
        !prompt.toLowerCase().includes("desi")) {
      enhancedPrompt = `${prompt}, with subtle Indian cultural elements, vibrant colors`;
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data[0].url || "" };
  } catch (error) {
    console.error("OpenAI Image API error:", error);
    return {
      url: "https://via.placeholder.com/1024x1024?text=Error+Generating+Image"
    };
  }
}

/**
 * Check code for validity
 */
export async function checkCodeValidity(
  code: string,
  language: string
): Promise<{ isValid: boolean; suggestions?: string[]; errorMessage?: string }> {
  if (!isConfigured()) {
    return { 
      isValid: false,
      errorMessage: "OpenAI API Key not configured."
    };
  }

  try {
    const systemPrompt = `You are a code review expert. 
Review the following ${language} code and check for errors, bugs, or potential issues.
Respond in JSON format with the following structure:
{
  "isValid": boolean,
  "suggestions": string[],
  "errorMessage": string (if applicable)
}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: code }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1024
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      isValid: result.isValid || false,
      suggestions: result.suggestions || [],
      errorMessage: result.errorMessage
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      isValid: false,
      errorMessage: "Failed to check code. Please try again later."
    };
  }
}

/**
 * Generate a 2D game based on a prompt
 */
export async function generateGame(prompt: string): Promise<{ 
  title: string;
  description: string;
  gameCode: string;
  gameUrl: string;
  thumbnailUrl: string;
  assets: {
    sprites: string[];
    backgrounds: string[];
    sounds: string[];
  };
  gameType: '2d-platformer' | '2d-puzzle' | '2d-rpg' | '2d-shooter';
}> {
  if (!isConfigured()) {
    return { 
      title: "Demo Game",
      description: "This is a placeholder game. Add your OpenAI API key to generate real games.",
      gameCode: `// Placeholder code
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = 'white';
ctx.font = '20px Arial';
ctx.fillText('Please configure OpenAI API Key', 100, 100);`,
      gameUrl: "/demo-game",
      thumbnailUrl: "https://via.placeholder.com/512x512?text=Game+Preview"
    };
  }

  try {
    // First, generate a game concept
    const conceptPrompt = `Create a fun and engaging 2D game concept based on this prompt: "${prompt}".
Respond in JSON format with the following structure:
{
  "title": string,
  "description": string,
  "gameType": string, // e.g., "platformer", "puzzle", "shooter"
  "mainCharacter": string,
  "objective": string,
  "visualStyle": string
}`;

    try {
      const conceptResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a creative video game designer specializing in 2D games." },
          { role: "user", content: conceptPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1024
      });

      if (!conceptResponse.choices[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI API');
      }

    const concept = JSON.parse(conceptResponse.choices[0].message.content || "{}");

    // Generate the HTML/JavaScript code for the game
    const assetSources = {
  sprites: "https://opengameart.org/art-search",
  sounds: "https://freesound.org",
  backgrounds: "https://craftpix.net/freebies"
};

const codePrompt = `Create a playable HTML5 canvas game based on this concept:
Title: ${concept.title}
Description: ${concept.description}
Game Type: ${concept.gameType}
Main Character: ${concept.mainCharacter}
Objective: ${concept.objective}

Use these free asset sources for graphics and sounds:
- Sprites: ${assetSources.sprites}
- Sound Effects: ${assetSources.sounds}
- Background Art: ${assetSources.backgrounds}

Include asset loading and management code.
Use preloading for all assets before starting the game.
Visual Style: ${concept.visualStyle}

Generate a complete, playable HTML and JavaScript game using the Canvas API.
The game should be fun, bug-free, and fully functional in a modern browser.
Include simple controls (arrow keys or WASD).
Make sure to include complete JS, CSS, and HTML needed to run the game.
Include helpful comments in the code.`;

    const codeResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert JavaScript game developer specializing in HTML5 canvas games." },
        { role: "user", content: codePrompt }
      ],
      temperature: 0.3,
      max_tokens: 4096
    });

    const gameCode = codeResponse.choices[0].message.content || "";

    // Generate a thumbnail image for the game
    const imagePrompt = `Create a vibrant, appealing thumbnail image for a 2D game titled "${concept.title}". The game is a ${concept.gameType} with ${concept.visualStyle} style. It features ${concept.mainCharacter} as the main character. The image should capture the essence and visual style of the game.`;

    const imageResult = await generateImage(imagePrompt);

    return {
      title: concept.title,
      description: concept.description,
      gameCode: gameCode,
      gameUrl: `/game/${encodeURIComponent(concept.title.toLowerCase().replace(/\s+/g, '-'))}`,
      thumbnailUrl: imageResult.url
    };
  } catch (error) {
    console.error("Game generation error:", error);
    return {
      title: "Error Game",
      description: "An error occurred while generating your game. Please try again.",
      gameCode: `// Error placeholder
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = 'red';
ctx.font = '20px Arial';
ctx.fillText('Error generating game', 100, 100);`,
      gameUrl: "/error-game",
      thumbnailUrl: "https://via.placeholder.com/512x512?text=Error+Generating+Game"
    };
  }
}

/**
 * Generate music based on a prompt
 */
export async function generateMusic(
  prompt: string,
  duration: number = 30,
  genre?: string,
  type: 'background' | 'effect' | 'theme' = 'background'
): Promise<{
  title: string;
  description: string;
  musicUrl: string;
  duration: number;
  bpm: number;
  loop: boolean;
  category: string;
  instruments: string[];
  tags: string[];
}> {
  if (!isConfigured()) {
    return { 
      title: "Demo Music",
      description: "This is a placeholder track. Add your OpenAI API key to generate real music.",
      musicUrl: "https://example.com/demo-music.mp3",
      duration: 30
    };
  }

  try {
    // First, generate a music concept
    const genreContext = genre ? `in the ${genre} genre` : "";
    const conceptPrompt = `Create a musical composition concept based on this prompt: "${prompt}" ${genreContext}.
The piece should be approximately ${duration} seconds long.
Respond in JSON format with the following structure:
{
  "title": string,
  "description": string,
  "mood": string,
  "instruments": string[],
  "tempo": string,
  "structure": string
}`;

    const conceptResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a skilled music composer with expertise in multiple genres." },
        { role: "user", content: conceptPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1024
    });

    const concept = JSON.parse(conceptResponse.choices[0].message.content || "{}");

    // Since we can't actually generate audio with the GPT model,
    // we'll generate a detailed MIDI description that could be used with a synthesizer
    const midiPrompt = `Create a detailed MIDI composition description for this music concept:
Title: ${concept.title}
Description: ${concept.description}
Mood: ${concept.mood}
Instruments: ${concept.instruments.join(', ')}
Tempo: ${concept.tempo}
Structure: ${concept.structure}

Provide a measure-by-measure breakdown with notes, chord progressions, and dynamics.
This should be detailed enough that a musician could recreate the piece.`;

    const midiResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert music composer and MIDI programmer." },
        { role: "user", content: midiPrompt }
      ],
      temperature: 0.4,
      max_tokens: 2048
    });

    const midiDescription = midiResponse.choices[0].message.content || "";

    // In a real implementation, you would:
    // 1. Use the MIDI description to generate actual MIDI data
    // 2. Use a music synthesis API to convert MIDI to audio
    // 3. Store the audio file and return its URL

    // For demonstration purposes, we're returning a placeholder URL
    // In a real production environment, you would integrate with a music generation API

    return {
      title: concept.title,
      description: concept.description + "\n\n" + midiDescription,
      musicUrl: `/music/${encodeURIComponent(concept.title.toLowerCase().replace(/\s+/g, '-'))}.mp3`,
      duration: duration
    };
  } catch (error) {
    console.error("Music generation error:", error);
    return {
      title: "Error Music",
      description: "An error occurred while generating your music. Please try again.",
      musicUrl: "/error-music.mp3",
      duration: duration
    };
  }
}