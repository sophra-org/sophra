import type {
  BaseDocument,
  DocumentMetadata,
} from "@/lib/cortex/elasticsearch/types";
import { EventEmitter as NodeEventEmitter } from "events";

/**
 * 📢 Document Event Types: What Can Happen to Documents
 *
 * All the different things that can happen to a document in our system.
 * Like a list of important moments in a document's life! 📝
 *
 * Events:
 * - 🎉 document.created - A new document is born
 * - ✏️ document.updated - A document gets changed
 * - 🗑️ document.deleted - A document is removed
 * - ✨ document.processed - A document is enhanced
 * - 📋 schema.updated - The document structure changes
 */
export type DocumentEventType =
  | "document.created"
  | "document.updated"
  | "document.deleted"
  | "document.processed"
  | "schema.updated";

/**
 * 📨 Document Event: The Message About What Happened
 *
 * Contains all the important details about something that happened to a document.
 * Like a detailed notification that tells us what changed! 📝
 *
 * @interface DocumentEvent
 * @template T - The type of document this event is about
 *
 * @property {DocumentEventType} type - What kind of event happened
 * @property {string} index - Where the document lives
 * @property {string} id - Which document it is
 * @property {T} [document] - The document itself (if available)
 * @property {DocumentMetadata} [metadata] - Extra document info
 * @property {Date} timestamp - When it happened
 */
export interface DocumentEvent<T extends BaseDocument> {
  type: DocumentEventType;
  index: string;
  id: string;
  document?: T;
  metadata?: DocumentMetadata;
  timestamp: Date;
}

/**
 * 📢 Event Emitter: Our Document News Broadcaster!
 *
 * This is like a news station that tells everyone when something happens to a document.
 * It helps different parts of our system stay in sync! 🔄
 *
 * Features:
 * - 📣 Broadcasts document events
 * - 👂 Lets others listen for events
 * - 🔄 Keeps everything synchronized
 *
 * @class EventEmitter
 */
export class EventEmitter {
  private emitter = new NodeEventEmitter();

  /**
   * 📣 Broadcasts an Event
   *
   * Tells everyone who's listening that something happened to a document.
   * Like a news flash announcement! 📢
   *
   * @template T - Type of document involved
   * @param {DocumentEvent<T>} event - The news to broadcast
   * @returns {boolean} Whether anyone was listening
   */
  emit<T extends BaseDocument>(event: DocumentEvent<T>): boolean {
    return this.emitter.emit(event.type, event);
  }

  /**
   * 👂 Listens for Events
   *
   * Sets up a listener for specific types of document events.
   * Like subscribing to specific news topics! 📰
   *
   * @template T - Type of document to listen for
   * @param {DocumentEventType} type - What kind of events to listen for
   * @param {function} handler - What to do when an event happens
   * @returns {NodeEventEmitter} The event listener
   */
  on<T extends BaseDocument>(
    type: DocumentEventType,
    handler: (event: DocumentEvent<T>) => void
  ): NodeEventEmitter {
    return this.emitter.on(type, handler);
  }
}
