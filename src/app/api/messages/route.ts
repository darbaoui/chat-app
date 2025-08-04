import {
  generateTiptapJson,
  getRandomMediaItems,
} from '@/modules/Chat/components/helper';
import { TOTAL_MESSAGES, USERS } from '@/modules/Chat/constants';
import { faker } from '@faker-js/faker';
import { NextRequest, NextResponse } from 'next/server';

function generateMessage(index: number, message_count: number) {
  const user = USERS[index % USERS.length];
  const createdAt = new Date(
    Date.now() - (TOTAL_MESSAGES - index) * 3600000
  ).toISOString(); // 1 minute per message = 60000 ms , 1h = 3600000 ms
  // If audio is present, the text content should be empty

  return Array.from({ length: message_count }, () => {
    const { media, hasAudio } = getRandomMediaItems(); // Get media and check if audio is present
    const messageText = hasAudio ? null : generateTiptapJson(index + 1);
    return {
      id: faker.string.uuid(),
      content: messageText,
      created_at: createdAt,
      user,
      media,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  if (process.env.NODE_ENV === 'development') {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  // Calculate descending indices
  const start = TOTAL_MESSAGES - (page - 1) * limit - 1;
  const end = Math.max(start - limit + 1, 0);

  const messages = [];
  for (let i = start; i >= end; i--) {
    const message_count = 1; // faker.number.int({ min: 1, max: 5 });
    messages.push(...generateMessage(i, message_count));
  }

  return NextResponse.json({
    data: messages,
    page,
    limit,
    total: TOTAL_MESSAGES,
    hasMore: end > 0,
  });
}
