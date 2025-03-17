// File: app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Store your API key in .env.local
const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Extract the system message if present
    const systemMessage = messages.find((m: any) => m.role === 'system')?.content || '';
    
    // Format history for Gemini API (excluding system message)
    const chatMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((message: any) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      }));

    // Construct request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemMessage}\n\nRespond to this conversation:\n${JSON.stringify(chatMessages)}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    console.log("Sending request to Gemini API:", JSON.stringify(requestBody, null, 2));
    
    // Updated endpoint URL for Gemini Pro
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));
    
    // Extract the assistant's response
    const assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Neural Link error: Failed to parse response from AI core.";

    // Return the response
    return NextResponse.json({ response: assistantResponse }, { status: 200 });
  } catch (error) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}