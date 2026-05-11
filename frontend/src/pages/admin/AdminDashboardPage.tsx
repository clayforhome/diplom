import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';

export function AdminDashboardPage() {
  useEffect(() => {
    document.title = 'Панель администратора - Система управления встречами';
  }, []);

  return (
    <PageSection title="Панель администратора">
      <div className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">Административное рабочее пространство</span>
          <h2>Контроль доступа и обзор системных сценариев</h2>
          <p>Панель собрана так, чтобы быстрее вести к нужным административным действиям и не распадаться на случайные одиночные карточки.</p>
        </div>
        <Link to="/admin/users" className="admin-hero__link">
          Открыть пользователей
        </Link>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <h3>Что доступно сейчас</h3>
          <p>В текущей серверной реализации стабильно работают просмотр списка пользователей, удаление аккаунтов и сброс паролей.</p>
        </section>
        <section className="admin-panel">
          <h3>Что ещё ограничено</h3>
          <p>Изменение ролей и отдельное управление деактивацией аккаунтов пока не вынесены в самостоятельный интерфейс, потому что backend ещё не отдаёт для этого отдельные маршруты.</p>
        </section>
        <section className="admin-panel admin-panel--accent">
          <h3>Рабочий маршрут</h3>
          <p>Начинайте со списка пользователей, затем проверяйте учётные данные и уже после этого возвращайтесь к общему рабочему пространству для управления встречами.</p>
        </section>
      </div>
    </PageSection>
  );
}
