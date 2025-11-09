import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "path";
import fs from "fs";

// Cache for the PDF content to avoid reloading on every request
let pdfContentCache: string | null = null;
let pdfChunksCache: string[] | null = null;

// Load and process the PDF document
async function loadAndProcessPDF(): Promise<{ fullText: string; chunks: string[] }> {
  // Check cache first
  if (pdfContentCache && pdfChunksCache) {
    console.log("Using cached PDF data");
    return { fullText: pdfContentCache, chunks: pdfChunksCache };
  }

  console.log("Loading PDF document...");

  // Path to the PDF file
  const pdfPath = path.join(process.cwd(), "NextWave_Technologies_Q1_2025_OKRs.pdf");

  // Check if PDF exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found at: ${pdfPath}`);
  }

  // Load the PDF
  const loader = new PDFLoader(pdfPath);
  const docs = await loader.load();

  // Extract full text for context
  const fullText = docs.map(doc => doc.pageContent).join("\n\n");

  // Split the documents into chunks for better context management
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300,
  });

  const splits = await textSplitter.splitDocuments(docs);
  const chunks = splits.map(doc => doc.pageContent);

  // Cache the results
  pdfContentCache = fullText;
  pdfChunksCache = chunks;

  console.log(`Loaded and processed ${docs.length} pages, created ${chunks.length} chunks`);

  return { fullText, chunks };
}

// Simple keyword-based relevance scoring
function getRelevantChunks(chunks: string[], question: string, topK: number = 3): string[] {
  // Extract keywords from question (simple approach)
  const questionLower = question.toLowerCase();
  const keywords = questionLower
    .split(/\s+/)
    .filter(word => word.length > 3 && !['what', 'when', 'where', 'which', 'does', 'have', 'that', 'this', 'with', 'from'].includes(word));

  // Score each chunk based on keyword matches
  const scoredChunks = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;

    // Count keyword occurrences
    keywords.forEach(keyword => {
      const matches = (chunkLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });

    // Bonus for chunks that contain question-related words
    if (chunkLower.includes('objective')) score += 2;
    if (chunkLower.includes('key result')) score += 2;
    if (chunkLower.includes('target')) score += 1;
    if (chunkLower.includes('metric')) score += 1;

    return { chunk, score, index };
  });

  // Sort by score and return top K chunks
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK).map(item => item.chunk);
}

// Create the OKR analysis tool
export const createOKRAnalysisTool = () => {
  return new DynamicStructuredTool({
    name: "okr_analysis",
    description: "Analyzes OKR documents to answer questions about objectives, key results, and progress.",
    schema: z.object({
      question: z.string().describe("The question to answer about the OKR document"),
    }),
    func: async ({ question }) => {
      try {
        const answer = await analyzeOKRWithAI(question);
        return JSON.stringify({
          success: true,
          answer,
          message: "OKR analysis completed successfully"
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "Failed to analyze OKR document"
        });
      }
    },
  });
};

// AI-based OKR analysis (without embeddings)
async function analyzeOKRWithAI(question: string): Promise<string> {
  // Initialize the Gemini model
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.3, // Lower temperature for more factual responses
    apiKey: process.env.GOOGLE_API_KEY,
  });

  // Load and process the PDF
  const { fullText, chunks } = await loadAndProcessPDF();

  // Get relevant chunks based on keywords
  const relevantChunks = getRelevantChunks(chunks, question, 3);

  // If we have very few chunks or short document, just use the full text
  const context = chunks.length <= 5 ? fullText : relevantChunks.join("\n\n---\n\n");

  // Create the prompt with context
  const prompt = `You are an expert at analyzing OKR (Objectives and Key Results) documents. You have been provided with content from a company's OKR document.

CONTEXT FROM OKR DOCUMENT:
${context}

QUESTION:
${question}

INSTRUCTIONS:
1. Answer the question based ONLY on the information provided in the context above
2. Be specific and cite relevant objectives, key results, or metrics when possible
3. If the context doesn't contain enough information to answer the question, clearly state that
4. Format your response in a clear, professional manner using markdown
5. Use bullet points or numbered lists when appropriate
6. If discussing metrics or progress, include specific numbers mentioned in the document
7. Structure your answer with clear headings if the answer has multiple parts

Please provide a comprehensive answer:`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const answer = response.content as string;

  return answer;
}

// Export a simple API handler function
export async function analyzeOKR(question: string): Promise<string> {
  return analyzeOKRWithAI(question);
}

// Get document summary
export async function getOKRSummary(): Promise<string> {
  // For summary, we want to use the full document
  const { fullText } = await loadAndProcessPDF();

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.3,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const prompt = `You are an expert at analyzing OKR (Objectives and Key Results) documents. Please provide a comprehensive summary of the following OKR document.

DOCUMENT CONTENT:
${fullText}

INSTRUCTIONS:
Please create a well-structured summary that includes:
1. An overview of the document (company, time period, scope)
2. All objectives organized by department/team
3. Key results for each objective with their targets and metrics
4. Any notable themes or priorities across objectives

Format the summary in clear, readable markdown with:
- Clear headings for each department/team
- Bullet points for objectives
- Sub-bullets for key results
- Bold text for important metrics or targets

Provide a comprehensive summary:`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  return response.content as string;
}

// Clear the cache (useful for when PDF is updated)
export function clearOKRCache(): void {
  pdfContentCache = null;
  pdfChunksCache = null;
  console.log("OKR cache cleared");
}

// Example usage function for testing
export async function exampleUsage() {
  const questions = [
    "What are the main objectives for Q1 2025?",
    "What are the key results for the Engineering department?",
    "What is the target for customer satisfaction score?"
  ];

  for (const question of questions) {
    console.log(`\nQuestion: ${question}`);
    const answer = await analyzeOKR(question);
    console.log(`Answer: ${answer}\n`);
  }
}