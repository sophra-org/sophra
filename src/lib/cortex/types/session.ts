/**
 * 🎭 Session Types: Your Chat Memory Blueprint!
 *
 * All the building blocks for remembering conversations.
 * Like having a magical diary that remembers everything! 📖
 */

/**
 * 👤 Session: Your Digital Identity
 *
 * Keeps track of who you are and what you're doing.
 * Like having a special name tag that remembers you! 🏷️
 *
 * @interface Session
 * @property {string} id - Your unique identifier
 * @property {string} userId - Who you are (if logged in)
 * @property {Date} startedAt - When you first arrived
 * @property {Date} lastActiveAt - When you last did something
 * @property {Date} createdAt - When your tag was made
 * @property {Date} updatedAt - When your tag was updated
 * @property {Object} metadata - Extra notes about you
 */
export interface Session {
  id: string;
  userId: string | null;
  startedAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * 💭 Conversation: Your Chat History
 *
 * A record of messages between you and the assistant.
 * Like having a magical scroll that records your chat! 📜
 *
 * @interface Conversation
 * @property {string} id - Which chat this is
 * @property {string} sessionId - Who's chatting
 * @property {string} [title] - What the chat is about
 * @property {Message[]} messages - All the messages
 * @property {Object} [context] - Extra helpful info
 */
export interface Conversation {
  id: string;
  sessionId: string;
  title?: string;
  messages: Message[];
  context?: {
    relevantDocuments?: string[];
    searchQueries?: string[];
    metadata?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 💌 Message: A Single Chat Bubble
 *
 * One message in a conversation.
 * Like a magical letter in a bottle! 📝
 *
 * @interface Message
 * @property {string} id - Which message this is
 * @property {string} conversationId - Which chat it's in
 * @property {string} role - Who sent it (user/assistant/system)
 * @property {string} content - What was said
 * @property {Date} timestamp - When it was sent
 * @property {Object} [metadata] - Extra message details
 */
export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    citations?: string[];
    searchQuery?: string;
    relevanceScore?: number;
  };
}
