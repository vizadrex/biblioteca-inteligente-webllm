export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}
