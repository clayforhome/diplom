import { useTranslation } from 'react-i18next';
import './Spinner.scss';

export function Spinner() {
  const { t } = useTranslation();
  return <div className="spinner" aria-label={t('common.loading')} />;
}
