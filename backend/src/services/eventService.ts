import type { LambdaEvent } from 'commoneventframework/dist/types/commonEvent';
import { resolveRoute } from './cefService';

function createQueueMessage(eventPath: string, eventPayload: object): LambdaEvent {
  const queueMessage = {
    Records: [
      { eventSource: 'aws:sqs', body: JSON.stringify({ path: eventPath, ...eventPayload }) },
    ],
  };
  return queueMessage as unknown as LambdaEvent;
}

export async function publishEvent(eventPath: string, eventPayload: object): Promise<void> {
  try {
    const resolvedRoute = resolveRoute(createQueueMessage(eventPath, eventPayload));
    if (!resolvedRoute || resolvedRoute.access.kind !== 'internal') {
      throw new Error(`No event handler is registered for "${eventPath}"`);
    }
    const { commonEvent, inputParser, routeHandler } = resolvedRoute;
    const input = inputParser ? inputParser(commonEvent) : {};
    await routeHandler(input, { commonEvent });
  } catch (error) {
    console.error(`Event "${eventPath}" could not be handled`, error);
  }
}
