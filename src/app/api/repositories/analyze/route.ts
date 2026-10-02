import { handleAnalyzeRequest } from './handler';

export async function POST(request: Request) {
  return handleAnalyzeRequest(request);
}
