import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth-middleware";
import { connectToDatabase } from "../../../../lib/mongodb";
import { User } from "../../../../lib/models/User";
import { Conversation } from "../../../../lib/models/Conversation";
import { Message } from "../../../../lib/models/Message";

// GET: Get user profile with statistics
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    await connectToDatabase();

    // Fetch user details
    const userDetails = await User.findById(user!.userId).select("-password");

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memberSince = userDetails.memberSince || userDetails.createdAt;

    // Get user statistics
    const conversationCount = await Conversation.countDocuments({
      userId: user!.userId,
    });

    const messageCount = await Message.countDocuments({
      conversationId: {
        $in: await Conversation.find({ userId: user!.userId }).distinct("_id"),
      },
    });

    // Get most recent conversation
    const recentConversation: any = await Conversation.findOne({
      userId: user!.userId,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    return NextResponse.json(
      {
        user: {
          id: userDetails._id.toString(),
          name: userDetails.name,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          email: userDetails.email,
          avatarUrl: userDetails.avatarUrl,
          bio: userDetails.bio,
          preferences: {
            darkMode: userDetails.preferences?.darkMode ?? false,
            notifications: userDetails.preferences?.notifications ?? true,
          },
          plan: userDetails.plan || "Free",
          status: userDetails.status || "active",
          memberSince,
          createdAt: userDetails.createdAt,
        },
        statistics: {
          totalConversations: conversationCount,
          totalMessages: messageCount,
          lastActiveAt: recentConversation?.lastMessageAt || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT: Update user profile and preferences
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) return error;

    const body = await request.json();
    const {
      firstName,
      lastName,
      avatarUrl,
      bio,
      email,
      preferences,
    }: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      bio?: string;
      email?: string;
      preferences?: {
        darkMode?: boolean;
        notifications?: boolean;
      };
    } = body;

    await connectToDatabase();

    const currentUser = await User.findById(user!.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build updates with trimming/validation
    const updates: Record<string, any> = {};

    const cleanedFirstName =
      typeof firstName === "string" ? firstName.trim() : currentUser.firstName;
    const cleanedLastName =
      typeof lastName === "string" ? lastName.trim() : currentUser.lastName;
    const cleanedAvatar =
      typeof avatarUrl === "string" ? avatarUrl.trim() : currentUser.avatarUrl;
    const cleanedBio =
      bio !== undefined
        ? typeof bio === "string"
          ? bio.trim().slice(0, 400)
          : ""
        : currentUser.bio || "";

    updates.firstName = cleanedFirstName;
    updates.lastName = cleanedLastName;
    updates.avatarUrl = cleanedAvatar;
    updates.bio = cleanedBio;

    if (typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { error: "Please provide a valid email" },
          { status: 400 }
        );
      }

      const emailOwner = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user!.userId },
      });

      if (emailOwner) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        );
      }

      updates.email = normalizedEmail;
    } else {
      updates.email = currentUser.email;
    }

    const nextPreferences = {
      darkMode:
        preferences?.darkMode !== undefined
          ? preferences.darkMode
          : currentUser.preferences?.darkMode ?? false,
      notifications:
        preferences?.notifications !== undefined
          ? preferences.notifications
          : currentUser.preferences?.notifications ?? true,
    };

    console.log("Received preferences:", preferences);
    console.log("Next preferences:", nextPreferences);

    // Keep legacy name in sync
    const composedName = `${cleanedFirstName || ""} ${
      cleanedLastName || ""
    }`.trim();
    if (composedName) {
      updates.name = composedName;
    }

    // Update preferences using dot notation to ensure proper Mongoose handling
    updates["preferences.darkMode"] = nextPreferences.darkMode;
    updates["preferences.notifications"] = nextPreferences.notifications;

    console.log("Updates object:", updates);

    const updatedUser = await User.findByIdAndUpdate(
      user!.userId,
      { $set: updates },
      { new: true, runValidators: true, strict: false }
    ).select("-password");

    console.log("Updated user preferences:", updatedUser?.preferences);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl,
          bio: updatedUser.bio,
          preferences: {
            darkMode: updatedUser.preferences?.darkMode ?? false,
            notifications: updatedUser.preferences?.notifications ?? true,
          },
          plan: updatedUser.plan || "Free",
          status: updatedUser.status || "active",
          memberSince: updatedUser.memberSince || updatedUser.createdAt,
          createdAt: updatedUser.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
