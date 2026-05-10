import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';

export function AdminDashboardPage() {
  useEffect(() => {
    document.title = 'Панель администратора - Meeting Management System';
  }, []);

  return (
    <PageSection title="Admin dashboard" subtitle="Точка входа для административных функций, доступных в текущем backend">
      <div className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">Administrative workspace</span>
          <h2>Контроль доступа и обзор системных сценариев</h2>
          <p>Собрал админскую панель более структурно, чтобы она не выглядела как одиночная карточка и быстрее вела к нужным действиям.</p>
        </div>
        <Link to="/admin/users" className="admin-hero__link">
          Открыть пользователей
        </Link>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <h3>Что доступно сейчас</h3>
          <p>В текущей серверной реализации стабильно работает просмотр списка пользователей и базовый доступ роли `Admin`.</p>
        </section>
        <section className="admin-panel">
          <h3>Что ещё ограничено</h3>
          <p>Изменение ролей и деактивация аккаунтов пока не вынесены в отдельный рабочий UI, потому что backend ещё не отдал полноценные маршруты для этих операций.</p>
        </section>
        <section className="admin-panel admin-panel--accent">
          <h3>Рабочий маршрут</h3>
          <p>Начинайте с просмотра пользователей, затем проверяйте роли и уже после этого возвращайтесь в общий workspace для управления встречами.</p>
        </section>
      </div>
    </PageSection>
  );
}
