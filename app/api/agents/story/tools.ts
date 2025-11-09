import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";

// Define the interface for the generated story
export interface UserStory {
  userStory: string;
  acceptanceCriteria: string[];
  nonFunctionalRequirements: string[];
  telemetryPlan: {
    eventName: string;
    properties: string[];
    question: string;
  }[];
}

// Create the story generator tool
export const createStoryGeneratorTool = () => {
  return new DynamicStructuredTool({
    name: "story_generator",
    description: "Generates a user story with acceptance criteria, non-functional requirements, and telemetry plan from an epic description.",
    schema: z.object({
      epic: z.string().describe("The epic description or feature request"),
    }),
    func: async ({ epic }) => {
      try {
        const story = await generateStoryWithAI(epic);
        return JSON.stringify({
          success: true,
          story,
          message: "User story generated successfully"
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
          message: "Failed to generate user story"
        });
      }
    },
  });
};

// AI-powered story generation
async function generateStoryWithAI(epic: string): Promise<string> {
  // Initialize the Gemini model
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const prompt = `You are a Product Owner.

Given this epic, produce in Markdown:
1) A single clear user story (As a..., I want..., so that...).
2) 4–6 acceptance criteria in Gherkin format (Given, When, Then).
3) 3 non-functional requirements (performance, reliability, UX).
4) A telemetry plan with:
   - 3 event names
   - their key properties
   - what question each event helps answer.

Epic:
${epic}

Format the output in clean, well-structured Markdown with clear headings and proper formatting. Use the following structure:

# User Story
[User story here]

## Acceptance Criteria
1. **Given** [context], **When** [action], **Then** [outcome]
2. ...

## Non-Functional Requirements
1. **Performance:** [requirement]
2. **Reliability:** [requirement]
3. **UX:** [requirement]

## Telemetry Plan
### Event 1: [EventName]
- **Properties:** property1, property2, property3
- **Question:** What question does this help answer?

### Event 2: [EventName]
- **Properties:** property1, property2, property3
- **Question:** What question does this help answer?

### Event 3: [EventName]
- **Properties:** property1, property2, property3
- **Question:** What question does this help answer?
`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const storyMarkdown = response.content as string;

  return storyMarkdown;
}

// Export a simple API handler function
export async function generateStory(epic: string): Promise<string> {
  return generateStoryWithAI(epic);
}

// Example usage function for testing
export async function exampleUsage() {
  const epic = "As a university, we want to provide students with an AI-powered FAQ chatbot that can answer common questions about courses, registration, and campus services, so that we can reduce support ticket volume and improve student satisfaction.";

  const result = await generateStory(epic);
  console.log(result);
  return result;
}