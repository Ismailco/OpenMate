import {
  handleInitializeChatRequest,
  handleDeleteChatSessionRequest,
} from './handler';

export async function POST(request: Request) {
  return handleInitializeChatRequest(request);
}

export async function DELETE(request: Request) {
  return handleDeleteChatSessionRequest(request);
}
