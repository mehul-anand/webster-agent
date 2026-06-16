export type Message = {
  id: number;
  content: string;
  role: "User" | "Assistant";
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string | null;
  slug: string;
  messages: Message[];
  _count: { messages: number };
};
