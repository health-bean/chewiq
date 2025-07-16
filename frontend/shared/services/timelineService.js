import { simpleApiClient } from './simpleApi';
import safeLogger from '../utils/safeLogger';

export const timelineService = {
  async getEntries(date) {
    const response = await simpleApiClient.get(`/api/v1/timeline/entries?date=${date}`);
    return response;
  },

  async createEntry(entryData) {
    const response = await simpleApiClient.post('/api/v1/timeline/entries', entryData);
    return response;
  }
};