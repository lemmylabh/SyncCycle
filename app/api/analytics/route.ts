import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const PROPERTY = `properties/${process.env.GA_PROPERTY_ID}`;

export async function GET() {
  try {
    const [summaryRes, trendRes, pagesRes, deviceRes] = await Promise.all([
      client.runReport({
        property: PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "sessionsPerUser" },
        ],
      }),
      client.runReport({
        property: PROPERTY,
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      client.runReport({
        property: PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
      client.runReport({
        property: PROPERTY,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    ]);

    const s = summaryRes[0].rows?.[0];
    const mv = (i: number) => parseFloat(s?.metricValues?.[i]?.value ?? "0");

    // Build a map of GA data keyed by "YYYYMMDD"
    const gaByDate: Record<string, { users: number; sessions: number; views: number }> = {};
    for (const row of trendRes[0].rows ?? []) {
      const raw = row.dimensionValues?.[0]?.value ?? "";
      gaByDate[raw] = {
        users: parseInt(row.metricValues?.[0]?.value ?? "0"),
        sessions: parseInt(row.metricValues?.[1]?.value ?? "0"),
        views: parseInt(row.metricValues?.[2]?.value ?? "0"),
      };
    }

    // Generate all 30 days, filling zeros for missing days
    const trend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10).replace(/-/g, "");
      const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
      return { date: label, ...(gaByDate[key] ?? { users: 0, sessions: 0, views: 0 }) };
    });

    const pages = pagesRes[0].rows?.map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "/",
      views: parseInt(row.metricValues?.[0]?.value ?? "0"),
      users: parseInt(row.metricValues?.[1]?.value ?? "0"),
    })) ?? [];

    const devices = deviceRes[0].rows?.map((row) => ({
      device: row.dimensionValues?.[0]?.value ?? "unknown",
      sessions: parseInt(row.metricValues?.[0]?.value ?? "0"),
      users: parseInt(row.metricValues?.[1]?.value ?? "0"),
    })) ?? [];

    return NextResponse.json({
      summary: {
        activeUsers: mv(0),
        newUsers: mv(1),
        totalUsers: mv(2),
        sessions: mv(3),
        pageViews: mv(4),
        engagementRate: mv(5),
        bounceRate: mv(6),
        avgSessionDuration: mv(7),
        sessionsPerUser: mv(8),
      },
      trend,
      pages,
      devices,
    });
  } catch (err) {
    console.error("GA API error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
