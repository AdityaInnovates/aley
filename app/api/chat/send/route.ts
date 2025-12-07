import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth } from "../../../../lib/auth-middleware";
import { connectToDatabase } from "../../../../lib/mongodb";
import { Conversation } from "../../../../lib/models/Conversation";
import { Message } from "../../../../lib/models/Message";
import { User } from "../../../../lib/models/User";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    const { message, conversationId } = await request.json();

    // Validate input
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { error: "Message is too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userRecord = (await User.findById(user!.userId).lean()) as {
      bio?: string;
    } | null;
    const userBio =
      typeof userRecord?.bio === "string" ? userRecord.bio.trim() : undefined;

    let conversation;

    // If conversationId is provided, verify it belongs to the user
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: user!.userId,
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    } else {
      // Create a new conversation with a temporary title
      conversation = await Conversation.create({
        userId: user!.userId,
        title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        lastMessageAt: new Date(),
      });
    }

    // Save user message
    const userMessage = await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    // Get conversation history for context
    const conversationHistory = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .limit(20) // Last 20 messages for context
      .lean();

    // Prepare chat history for Gemini
    const history = conversationHistory
      .filter((msg: any) => msg._id.toString() !== userMessage._id.toString())
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    const chatHistory = [
      ...(userBio
        ? [
            {
              role: "user",
              parts: [
                {
                  text: `User bio/context (use this to personalize tone and relevance, do not repeat it back unless asked): ${userBio}`,
                },
              ],
            },
          ]
        : []),
      ...history,
    ];

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send user message info first
          const userMessageData = {
            type: "userMessage",
            data: {
              id: userMessage._id.toString(),
              role: userMessage.role,
              content: userMessage.content,
              createdAt: userMessage.createdAt,
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(userMessageData)}\n\n`)
          );

          // Send conversation ID
          const conversationData = {
            type: "conversationId",
            data: conversation._id.toString(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(conversationData)}\n\n`)
          );

          // Stream AI response
          const result = await chat.sendMessageStream(message);
          let fullResponse = "";

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;

            const streamData = {
              type: "stream",
              data: chunkText,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`)
            );
          }

          // Save AI response to database
          const assistantMessage = await Message.create({
            conversationId: conversation._id,
            role: "assistant",
            content: fullResponse,
          });

          // Update conversation's lastMessageAt
          await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessageAt: new Date(),
          });

          // Send completion message with saved AI message
          const completeData = {
            type: "complete",
            data: {
              id: assistantMessage._id.toString(),
              role: assistantMessage.role,
              content: assistantMessage.content,
              createdAt: assistantMessage.createdAt,
            },
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completeData)}\n\n`)
          );

          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          const errorData = {
            type: "error",
            data: error.message || "Failed to generate response",
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat send error:", error);

    // Handle specific Gemini API errors
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }

    if (error.message?.includes("quota") || error.message?.includes("rate")) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
