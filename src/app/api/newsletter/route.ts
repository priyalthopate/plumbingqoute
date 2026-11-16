import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("email" in payload) ||
    typeof payload.email !== "string" ||
    payload.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())
  ) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    await prisma.newsletterSubscription.upsert({
      where: { email: payload.email.trim().toLowerCase() },
      create: { email: payload.email.trim().toLowerCase() },
      update: {},
    });

    return NextResponse.json({ message: "You’re on the list. Look out for a good thing." });
  } catch (error) {
    console.error("Could not save newsletter subscription:", error);
    return NextResponse.json(
      { error: "We couldn’t save your subscription. Please try again." },
      { status: 500 },
    );
  }
}
