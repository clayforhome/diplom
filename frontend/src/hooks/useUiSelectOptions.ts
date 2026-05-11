import { useEffect, useState } from 'react';
import { uiOptionsService } from '../http/uiOptionsService';
import type { UiSelectOptions } from '../types';

export function useUiSelectOptions() {
  const [options, setOptions] = useState<UiSelectOptions | null>(null);

  useEffect(() => {
    let isMounted = true;

    void uiOptionsService.getSelectOptions().then((response) => {
      if (isMounted) {
        setOptions(response);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return options;
}
