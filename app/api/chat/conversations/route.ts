import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth-middleware";
import { connectToDatabase } from "../../../../lib/mongodb";
import { Conversation } from "../../../../lib/models/Conversation";
import { Message } from "../../../../lib/models/Message";

// GET: List all conversations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Fetch conversations with pagination
    const conversations = await Conversation.find({ userId: user!.userId })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Conversation.countDocuments({
      userId: user!.userId,
    });

    // For each conversation, get the last message preview
    const conversationsWithPreviews = await Promise.all(
      conversations.map(async (conv: any) => {
        const lastMessage: any = await Message.findOne({
          conversationId: conv._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: conv._id.toString(),
          title: conv.title,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          preview: lastMessage
            ? {
                content: lastMessage.content.substring(0, 100),
                role: lastMessage.role,
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      {
        conversations: conversationsWithPreviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: skip + conversations.length < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and verify conversation ownership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: user!.userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    return NextResponse.json(
      { message: "Conversation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

// PATCH: Update conversation (e.g., rename)
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    const { conversationId, title } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Find and update conversation
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId: user!.userId },
      { title: title.trim() },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Conversation updated successfully",
        conversation: {
          id: conversation._id.toString(),
          title: conversation.title,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}
