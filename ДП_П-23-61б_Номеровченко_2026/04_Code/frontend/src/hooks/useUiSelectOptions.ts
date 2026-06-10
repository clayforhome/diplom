import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../http/httpClient';
import { uiOptionsService } from '../http/uiOptionsService';
import type { MeetingFormat, MeetingStatus, SelectOption, UiSelectOptions } from '../types';
import { getMeetingFormatLabel, getMeetingStatusLabel } from '../utils/meetingLabels';

const adminSortLabelKeys: Record<string, string> = {
  name: 'adminUsers.nameField',
  userName: 'adminUsers.fullNameField',
  email: 'adminUsers.emailField',
  age: 'adminUsers.ageField',
  registrationDate: 'adminUsers.registrationField'
};

const directionLabelKeys: Record<string, string> = {
  asc: 'adminUsers.asc',
  desc: 'adminUsers.desc'
};

function localizeOption<T extends string>(option: SelectOption<T>, label: string): SelectOption<T> {
  return {
    ...option,
    label
  };
}

export function useUiSelectOptions() {
  const [options, setOptions] = useState<UiSelectOptions | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    void uiOptionsService
      .getSelectOptions()
      .then((response) => {
        if (isMounted) {
          setOptions(response);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        // We gracefully fall back to local option labels when the UI options endpoint is unavailable.
        if (!(error instanceof ApiError) && error instanceof Error) {
          console.warn('Failed to load select options, using fallback values instead.', error);
        }

        setOptions(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo<UiSelectOptions | null>(() => {
    if (!options) {
      return null;
    }

    return {
      ...options,
      meetingFormats: options.meetingFormats.map((option) => localizeOption(option as SelectOption<MeetingFormat>, getMeetingFormatLabel(option.value as MeetingFormat))),
      meetingStatuses: options.meetingStatuses.map((option) => localizeOption(option as SelectOption<MeetingStatus>, getMeetingStatusLabel(option.value as MeetingStatus))),
      adminUserSortKeys: options.adminUserSortKeys.map((option) => localizeOption(option, adminSortLabelKeys[option.value] ? t(adminSortLabelKeys[option.value]) : option.label)),
      sortDirections: options.sortDirections.map((option) => localizeOption(option, directionLabelKeys[option.value] ? t(directionLabelKeys[option.value]) : option.label)),
      pageSizes: options.pageSizes
    };
  }, [i18n.resolvedLanguage, options, t]);
}
