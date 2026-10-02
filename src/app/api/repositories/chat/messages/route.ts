import { handleSendChatMessageRequest } from './handler';

export async function POST(request: Request) {
  return handleSendChatMessageRequest(request);
}
