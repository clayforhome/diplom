import { useToast } from 'primevue/usetoast'
import { useTypedI18n } from '@/i18n/useTypedI18n.ts'
import type { ToastMessageOptions } from 'primevue'

export type ShowErrorFunction = (
  data?: ToastMessageOptions & { autoClose?: boolean; error?: unknown },
) => void

export type ShowMessageFunction = (data?: ToastMessageOptions & { autoClose?: boolean }) => void

export function useMessageNotifier() {
  const toast = useToast()
  const { t } = useTypedI18n()

  const showError: ShowErrorFunction = ({
    summary,
    detail,
    life = 8000,
    error,
    autoClose = true,
  } = {}) => {
    if (error != null) {
      console.error(error)
    }

    toast.add({
      severity: 'error',
      summary: summary != null ? summary : t('errors.error'),
      detail: detail != null ? detail : t('errors.pleaseTryAgain'),
      life: autoClose ? life : undefined,
    })
  }

  const showMessage: ShowMessageFunction = ({
    summary,
    detail,
    life = 8000,
    autoClose = true,
  }: ToastMessageOptions & { autoClose?: boolean } = {}) => {
    toast.add({
      severity: 'info',
      summary: summary,
      detail: detail,
      life: autoClose === true ? life : undefined,
    })
  }

  return {
    showError,
    showMessage,
  }
}
