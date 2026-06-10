import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../../../i18n';
import './LanguageSwitcher.scss';

const languageOptions: Array<{ value: AppLanguage; labelKey: 'common.russian' | 'common.kazakh' }> = [
  { value: 'ru', labelKey: 'common.russian' },
  { value: 'kk', labelKey: 'common.kazakh' }
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'ru') as AppLanguage;
  const [isAnimating, setIsAnimating] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, x: 0 });
  const animationTimeoutRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<AppLanguage, HTMLButtonElement | null>>({
    ru: null,
    kk: null
  });

  const syncIndicator = () => {
    const root = rootRef.current;
    const activeButton = buttonRefs.current[currentLanguage];

    if (!root || !activeButton) {
      return;
    }

    setIndicatorStyle({
      width: activeButton.offsetWidth,
      x: activeButton.offsetLeft
    });
  };

  useEffect(() => {
    syncIndicator();
  }, [currentLanguage]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncIndicator();
    });

    observer.observe(root);
    Object.values(buttonRefs.current).forEach((button) => {
      if (button) {
        observer.observe(button);
      }
    });

    return () => observer.disconnect();
  }, [currentLanguage]);

  const triggerPageTransition = () => {
    if (typeof document === 'undefined') {
      return;
    }

    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
    }

    document.documentElement.classList.add('language-transition');
    setIsAnimating(true);

    animationTimeoutRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove('language-transition');
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 420);
  };

  const handleLanguageChange = async (language: AppLanguage) => {
    if (language === currentLanguage || isAnimating) {
      return;
    }

    triggerPageTransition();
    await i18n.changeLanguage(language);
  };

  return (
    <div
      ref={rootRef}
      className={`language-switcher${isAnimating ? ' language-switcher--animating' : ''}`}
      aria-label={t('common.language')}
    >
      <div
        className="language-switcher__indicator"
        aria-hidden="true"
        style={{
          width: `${indicatorStyle.width}px`,
          transform: `translateX(${indicatorStyle.x}px)`
        }}
      />
      {languageOptions.map((language) => {
        const label = t(language.labelKey);

        return (
          <button
            key={language.value}
            ref={(node) => {
              buttonRefs.current[language.value] = node;
            }}
            type="button"
            className={`language-switcher__button${currentLanguage === language.value ? ' language-switcher__button--active' : ''}`}
            onClick={() => void handleLanguageChange(language.value)}
            disabled={isAnimating}
          >
            <span className="language-switcher__text-wrap" aria-hidden="true">
              <span className="language-switcher__text language-switcher__text--primary">{label}</span>
              <span className="language-switcher__text language-switcher__text--secondary">{label}</span>
            </span>
            <span className="language-switcher__sr">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
