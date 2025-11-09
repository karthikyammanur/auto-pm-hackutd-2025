import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";

// Create the wireframe generator tool using LangGraph
export const createWireframeGeneratorTool = () => {
  return new DynamicStructuredTool({
    name: "wireframe_generator",
    description: "Generates an HTML wireframe page based on a user's idea or prompt. Creates a complete, styled HTML page with modern CSS that represents the wireframe of the concept.",
    schema: z.object({
      prompt: z.string().describe("The user's idea or description of what they want to create as a wireframe"),
    }),
    func: async ({ prompt }) => {
      try {
        const htmlWireframe = await generateWireframeWithLangGraph(prompt);
        return JSON.stringify({
          success: true,
          html: htmlWireframe,
          message: "HTML wireframe generated successfully"
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "Failed to generate wireframe"
        });
      }
    },
  });
};

// Simplified wireframe generation (no LangGraph complexity needed)
async function generateWireframeWithLangGraph(userPrompt: string): Promise<string> {
  // Initialize the Gemini model
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const systemPrompt = `You are an expert UI/UX designer and front-end developer specializing in creating beautiful, modern web designs. Create a stunning, fully-styled HTML wireframe that looks professional and visually appealing.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Return ONLY raw HTML code - nothing else
2. Start with <!DOCTYPE html> and end with </html>
3. DO NOT wrap the HTML in markdown code blocks (\`\`\`html)
4. DO NOT include any explanations, comments outside the HTML, or text before/after the code
5. The first line must be: <!DOCTYPE html>
6. The last line must be: </html>

DESIGN REQUIREMENTS - Create a BEAUTIFUL, MODERN design:

Visual Design:
- Use a sophisticated, modern color palette (not just grays!)
  * Primary: Beautiful blues (#3B82F6, #2563EB) or purples (#8B5CF6, #7C3AED)
  * Accent: Complementary colors for CTAs (#10B981, #F59E0B, #EF4444)
  * Backgrounds: Subtle gradients, soft colors (#F9FAFB, #EFF6FF, #F5F3FF)
  * Text: Proper hierarchy (#111827 for headings, #6B7280 for body)
- Use modern CSS features:
  * Subtle gradients for backgrounds and cards
  * Box shadows for depth (subtle: 0 1px 3px rgba(0,0,0,0.1), medium: 0 4px 6px rgba(0,0,0,0.1))
  * Border radius for rounded corners (8px, 12px, 16px)
  * Smooth transitions and hover effects
- Typography:
  * Use system font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  * Clear hierarchy: h1 (36-48px), h2 (30-36px), h3 (24px), body (16px)
  * Proper line-height (1.6 for body, 1.2 for headings)
  * Font weights: 700 for headings, 600 for subheadings, 400 for body

Layout & Spacing:
- Generous whitespace and padding (sections: 80-120px vertical, cards: 32-48px)
- Use CSS Grid and Flexbox for modern, responsive layouts
- Container max-width: 1200px with auto margins
- Consistent spacing scale: 8px, 16px, 24px, 32px, 48px, 64px, 80px

Components to Include (based on request):
- Hero sections with gradient backgrounds and large, bold typography
- Cards with shadows, rounded corners, and hover effects
- Buttons with gradients, shadows, and hover animations
- Icons using simple SVG shapes or unicode symbols (→, ✓, ★, etc.)
- Feature grids with 2-4 columns
- Testimonials with avatars (use colored circles with initials)
- Pricing tables with highlighted popular option
- Call-to-action sections with contrasting backgrounds
- Footer with multiple columns

Modern Effects & Details:
- Add subtle hover effects (transform: translateY(-4px), increased shadows)
- Use transition: all 0.3s ease for smooth animations
- Add decorative elements (colored dots, lines, or shapes)
- Include subtle background patterns or gradients
- Make buttons and interactive elements stand out
- Use badge/tag components with small rounded backgrounds

Technical Requirements:
- Complete, valid HTML5 document
- All CSS embedded in <style> tags in <head>
- Semantic HTML5 (header, nav, main, section, article, footer)
- Fully responsive with mobile-first approach
- No external dependencies or CDN links
- Cross-browser compatible CSS

User Request: ${userPrompt}

IMPORTANT: Make it VISUALLY STUNNING. This should look like a modern, professional website from 2024/2025, not a basic wireframe. Use colors, gradients, shadows, and spacing to create visual hierarchy and beauty. Think Stripe, Linear, Vercel, or Tailwind CSS showcase quality.

Remember: Output must start with <!DOCTYPE html> and contain NOTHING before or after the HTML code.`;

  const response = await model.invoke([new HumanMessage(systemPrompt)]);
  let htmlContent = response.content as string;

  // Try to extract HTML from markdown code blocks
  const codeBlockMatch = htmlContent.match(/```html\s*\n([\s\S]*?)\n```/) ||
                        htmlContent.match(/```\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    htmlContent = codeBlockMatch[1].trim();
  }

  // Try to extract just the DOCTYPE to </html> part
  const doctypeMatch = htmlContent.match(/<!DOCTYPE[\s\S]*?<\/html>/i);
  if (doctypeMatch) {
    htmlContent = doctypeMatch[0];
  }

  // Clean up any remaining markdown or extra text
  htmlContent = htmlContent.trim();

  // If still doesn't start with DOCTYPE, wrap in basic HTML
  if (!htmlContent.toLowerCase().startsWith('<!doctype')) {
    console.warn('Generated content did not start with DOCTYPE, wrapping in basic HTML');
    htmlContent = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Wireframe</title>
                    </head>
                    <body>
                        <div style="padding: 20px; font-family: sans-serif;">
                            <h1>Error generating wireframe</h1>
                            <p>The AI did not return valid HTML. Please try again.</p>
                        </div>
                    </body>
                    </html>`;
  }

  return htmlContent;
}

// Export a simple API handler function
export async function generateWireframe(prompt: string): Promise<string> {
  return generateWireframeWithLangGraph(prompt);
}

// Example usage function for testing
export async function exampleUsage() {
  const tool = createWireframeGeneratorTool();

  const result = await tool.invoke({
    prompt: "Create a landing page for a SaaS product with a hero section, features grid, pricing table, and footer"
  });

  console.log(result);
  return result;
}