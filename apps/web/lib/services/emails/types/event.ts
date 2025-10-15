export interface EventHandler {
  eventType: string;
  handler: (event: any) => Promise<void>;
}

export interface Event {
  type: string;
  data: any;
  timestamp: Date;
}