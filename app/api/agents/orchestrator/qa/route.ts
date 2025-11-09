import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, analysisData } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!analysisData) {
      return NextResponse.json(
        { success: false, error: 'Analysis data is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY not found in environment');
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Processing question:', question.substring(0, 50));

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are an expert product strategist and data analyst. Below is comprehensive analysis data about a product/idea.

Your role:
- Answer questions using the provided data as your source of facts
- Apply strategic thinking to interpret the data
- Provide actionable recommendations
- Be concise but thorough

Analysis Data:
${JSON.stringify(analysisData, null, 2)}

User Question: ${question}

Provide a clear, actionable answer based on the data above:`;

    console.log('Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    console.log('Answer generated successfully');

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('Q&A API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate answer',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
