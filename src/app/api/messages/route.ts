import { faker } from "@faker-js/faker";
import { NextRequest, NextResponse } from "next/server";

const TOTAL_MESSAGES = 2000;
const USERS = [
  {
    id: "current_user",
    name: "John Doe",
    avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: "user_2",
    name: "Jane Smith",
    avatar_url: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    id: "user_3",
    name: "Alex Lee",
    avatar_url: "https://randomuser.me/api/portraits/men/3.jpg",
  },
];

function generateTiptapContent(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text },
        ],
      },
    ],
  };
}

function generateMessage(index: number) {
  const user = USERS[index % USERS.length];
  const createdAt = new Date(Date.now() - (TOTAL_MESSAGES - index) * 60000).toISOString();
  return {
    id: faker.string.uuid(),
    text: generateTiptapContent(`#${index + 1} ${faker.lorem.sentence()}`),
    created_at: createdAt,
    user,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Calculate descending indices
  const start = TOTAL_MESSAGES - (page - 1) * limit - 1;
  const end = Math.max(start - limit + 1, 0);

  const messages = [];
  for (let i = start; i >= end; i--) {
    messages.push(generateMessage(i));
  }

  return NextResponse.json({
    messages, // Reverse to maintain chronological order
    page,
    limit,
    total: TOTAL_MESSAGES,
    hasMore: end > 0,
  });
} 