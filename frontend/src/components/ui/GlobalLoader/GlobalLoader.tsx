import { Spinner } from '../Spinner/Spinner';
import { useAppSelector } from '../../../store/hooks';
import './GlobalLoader.scss';

export function GlobalLoader() {
  const isVisible = useAppSelector((state) => state.ui.activeRequests > 0);

  return (
    <div
      className={`global-loader ${isVisible ? 'global-loader--visible' : ''}`}
      aria-hidden={!isVisible}
    >
      <div className="global-loader__backdrop" />
      <div className="global-loader__panel" role="status" aria-live="polite">
        <Spinner />
        <span className="global-loader__label">Загрузка...</span>
      </div>
    </div>
  );
}
