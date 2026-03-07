/**
 * API Route: GET /api/reintroductions/notifications
 * 
 * Fetch reintroduction notifications for the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { generateReintroductionNotifications, shouldShowNotification, getNotificationSummary } from "@/lib/notifications/reintroduction";

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    // For now, using a placeholder
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate notifications
    const allNotifications = await generateReintroductionNotifications(userId);

    // TODO: Get user preferences from database
    // For now, using defaults (all enabled)
    const userPreferences = {
      enableTestingReminders: true,
      enableObservationReminders: true,
      enableMissedDaysWarnings: true,
    };

    // Filter notifications based on preferences
    const notifications = allNotifications.filter((notification) =>
      shouldShowNotification(notification, userPreferences)
    );

    // Get summary
    const summary = getNotificationSummary(notifications);

    return NextResponse.json({
      notifications,
      summary,
      preferences: userPreferences,
    });
  } catch (error) {
    console.error("Error fetching reintroduction notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
