import { httpClient } from './httpClient';
import type { UiSelectOptions } from '../types';

let selectOptionsPromise: Promise<UiSelectOptions> | null = null;

export const uiOptionsService = {
  getSelectOptions(): Promise<UiSelectOptions> {
    if (!selectOptionsPromise) {
      selectOptionsPromise = httpClient.get<UiSelectOptions>('/ui/select-options');
    }

    return selectOptionsPromise;
  }
};
