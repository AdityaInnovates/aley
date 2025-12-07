import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth-middleware";
import { connectToDatabase } from "../../../../lib/mongodb";
import { Conversation } from "../../../../lib/models/Conversation";
import { Message } from "../../../../lib/models/Message";

// GET: Get conversation history with messages (with search, sort, filter, pagination)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Get query parameters
    const conversationId = searchParams.get("conversationId");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, oldest
    const filterDate = searchParams.get("filterDate") || ""; // YYYY-MM-DD
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // If conversationId is provided, get messages for that conversation
    if (conversationId) {
      // Verify conversation belongs to user
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

      // Build query for messages
      const messageQuery: any = { conversationId };

      // Add search filter if provided
      if (search) {
        messageQuery.$text = { $search: search };
      }

      // Add date filter if provided
      if (filterDate) {
        const startDate = new Date(filterDate);
        const endDate = new Date(filterDate);
        endDate.setDate(endDate.getDate() + 1);

        messageQuery.createdAt = {
          $gte: startDate,
          $lt: endDate,
        };
      }

      // Determine sort order
      const sortOrder = sortBy === "oldest" ? 1 : -1;

      // Fetch messages
      const messages = await Message.find(messageQuery)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count
      const totalCount = await Message.countDocuments(messageQuery);

      return NextResponse.json(
        {
          conversationId: conversation._id.toString(),
          conversationTitle: conversation.title,
          messages: messages.map((msg: any) => ({
            id: msg._id.toString(),
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasMore: skip + messages.length < totalCount,
          },
        },
        { status: 200 }
      );
    }

    // If no conversationId, return all conversations with their message counts
    const conversationQuery: any = { userId: user!.userId };

    // Add date filter for conversations if provided
    if (filterDate) {
      const startDate = new Date(filterDate);
      const endDate = new Date(filterDate);
      endDate.setDate(endDate.getDate() + 1);

      conversationQuery.lastMessageAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // Determine sort field for conversations
    let sortField = "lastMessageAt";
    let sortOrder = -1; // Newest first by default

    if (sortBy === "oldest") {
      sortOrder = 1;
    }

    // Fetch conversations
    const sortOptions: any = {};
    sortOptions[sortField] = sortOrder;
    const conversations = await Conversation.find(conversationQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Conversation.countDocuments(conversationQuery);

    // Get message count and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv: any) => {
        const messageCount = await Message.countDocuments({
          conversationId: conv._id,
        });

        const lastMessage: any = await Message.findOne({
          conversationId: conv._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        // If search is provided, search within conversation messages
        let hasMatch = true;
        if (search) {
          const matchCount = await Message.countDocuments({
            conversationId: conv._id,
            $text: { $search: search },
          });
          hasMatch = matchCount > 0;
        }

        return {
          id: conv._id.toString(),
          title: conv.title,
          messageCount,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content.substring(0, 100),
                role: lastMessage.role,
                createdAt: lastMessage.createdAt,
              }
            : null,
          hasSearchMatch: hasMatch,
        };
      })
    );

    // Filter out conversations without search matches if search is active
    const filteredConversations = search
      ? conversationsWithDetails.filter((conv) => conv.hasSearchMatch)
      : conversationsWithDetails;

    return NextResponse.json(
      {
        conversations: filteredConversations.map((conv) => {
          const { hasSearchMatch, ...rest } = conv;
          return rest;
        }),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(
            (search ? filteredConversations.length : totalCount) / limit
          ),
          totalCount: search ? filteredConversations.length : totalCount,
          hasMore: skip + conversations.length < totalCount,
        },
        filters: {
          search: search || null,
          sortBy,
          filterDate: filterDate || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
