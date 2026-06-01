import { httpClient } from './httpClient';
import type { MessageItem, PaginatedResponse } from '../types';

export const messagesService = {
  listMessages(page: number, limit: number): Promise<PaginatedResponse<MessageItem>> {
    return httpClient.get<PaginatedResponse<MessageItem>>(`/messages?page=${page}&limit=${limit}`);
  }
};
