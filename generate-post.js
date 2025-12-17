
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

const MODEL_NAME = 'gemini-3-pro-preview-thinking-low-count'; // New powerful model
// Heuristic: If key starts with 'sk-', it's likely an OpenAI-compatible proxy (like OneAPI)
// If it starts with 'AIza', it's Google.
const IS_OPENAI_COMPATIBLE = GEMINI_API_KEY.startsWith('sk-');
const BASE_URL = process.env.GEMINI_BASE_URL || (IS_OPENAI_COMPATIBLE ? 'https://tokencount.aigemini.org/v1' : 'https://generativelanguage.googleapis.com/v1beta');

if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
}

const args = process.argv.slice(2);
let topic = args[0];

// Auto-mode: Read from topics.txt if no topic provided
if (!topic) {
    const topicsFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'topics.txt');
    if (fs.existsSync(topicsFile)) {
        const lines = fs.readFileSync(topicsFile, 'utf-8').split('\n').filter(l => l.trim());
        if (lines.length > 0) {
            topic = lines[0]; // Take top one
            // Optional: Remove it from file so we don't repeat? For now, let's keep it simple or remove it.
            // Let's remove it to simulate true "queue" processing
            const remaining = lines.slice(1).join('\n');
            fs.writeFileSync(topicsFile, remaining);
            console.log(`📋 Auto-selected topic: "${topic}" (and removed from queue)`);
        }
    }
}

if (!topic) {
    console.error('❌ Error: No topic provided and topics.txt is empty.');
    process.exit(1);
}


async function generatePost(topic) {
    console.log(`🤖 Consulting Gemini (${MODEL_NAME}) about: "${topic}"...`);

    const prompt = `
  You are an expert technical content writer for a blog about "Generative UI", "AI User Experience", and "Gemini/LLM Technology".
  
  Task: Write a high-quality, SEO-optimized blog post in Markdown format about: "${topic}".
  
  Requirements:
  1.  **Frontmatter**: Must be a valid YAML frontmatter at the top.
      - title: Catchy, SEO-friendly title.
      - description: 150-160 chars meta description.
      - pubDate: Today's date (ISO 8601 string, e.g. "2023-10-27T12:00:00.000Z"). MUST be quoted.
      - heroImage: "../../assets/blog-placeholder-1.jpg" (Use this exact path).
  2.  **Structure**:
      - Introduction (Hook the reader).
      - H2 Headings for main points.
      - Code snippets if relevant (use Javascript/React).
      - "Our Take" Section: A specific section at the end interpreting why this matters for the future of AI Canvas interfaces.
      - **Money Link**: You MUST include a contextual link to "https://geminihub.ai" (anchor text: "GeminiHub" or "Gemini Canvas") within the "Our Take" section.
  3.  **Tone**: Professional, insightful, slightly futuristic.
  4.  **Format**: Pure Markdown. NO wrapping like \`\`\`markdown. Just the content.
  
  Write the file content now.
  `;

    try {
        let response;
        if (IS_OPENAI_COMPATIBLE) {
            // OpenAI Compatible Endpoint (e.g. OneAPI / NewAPI)
            response = await fetch(`${BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });
        } else {
            // Native Google Endpoint
            response = await fetch(`${BASE_URL}/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || JSON.stringify(error) || response.statusText);
        }

        const data = await response.json();
        let content = '';

        if (IS_OPENAI_COMPATIBLE) {
            content = data.choices[0].message.content;
        } else {
            content = data.candidates[0].content.parts[0].text;
        }

        // Clean up Markdown fences if Gemini adds them
        content = content.replace(/^```markdown\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

        // Generate Slug
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const filename = path.join(__dirname, 'src', 'content', 'blog', `${slug}.md`);

        // Ensure directory exists
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filename, content);
        console.log(`✅ Post generated successfully at: src/content/blog/${slug}.md`);

    } catch (error) {
        console.error('❌ Generation failed:', error.message);
    }
}

generatePost(topic);
