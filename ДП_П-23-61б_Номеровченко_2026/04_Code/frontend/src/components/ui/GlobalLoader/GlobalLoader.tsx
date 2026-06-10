import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../store/hooks';
import { Spinner } from '../Spinner/Spinner';
import './GlobalLoader.scss';

export function GlobalLoader() {
  const isVisible = useAppSelector((state) => state.ui.activeRequests > 0);
  const { t } = useTranslation();

  return (
    <div className={`global-loader ${isVisible ? 'global-loader--visible' : ''}`} aria-hidden={!isVisible}>
      <div className="global-loader__backdrop" />
      <div className="global-loader__panel" role="status" aria-live="polite">
        <Spinner />
        <span className="global-loader__label">{t('common.loading')}</span>
      </div>
    </div>
  );
}
