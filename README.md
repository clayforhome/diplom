# Инструкция по установке и запуску проекта Meetings-Sign

Документ описывает пошаговую настройку и запуск бэкенда и фронтенда проекта (локальная разработка / тестирование). Инструкции подходят для Windows (PowerShell).

---

Чеклист (быстрая сводка перед началом):
- Установить .NET 9 SDK
- Установить PostgreSQL и создать базу + пользователя
- Установить Node.js (LTS)
- Создать/прописать файл конфигурации `appsettings.Development.json` с credentials
- Установить SSL-сертификат (для Kestrel / HTTPS)
- Собрать и запустить бэкенд: `dotnet restore`, `dotnet ef database update`, `dotnet run`
- Запустить фронтенд: `npm install`, `npm run dev` (или `npm start` / `npm run build` — зависит от проекта)
- (Опционально) Установить IDE Rider для разработки

---

1) Необходимые ПО / версии

- .NET SDK 9.0 (судя по целевой платформе в проекте: net9.0)
- PostgreSQL 14/15/16 (любой современный релиз, совместимый с Npgsql)
- Node.js LTS (рекомендуется 18+)
- Для удобства разработки можно установить JetBrains Rider

Установка на Windows (ссылки/команды):
- .NET SDK: https://dotnet.microsoft.com/en-us/download/dotnet/9.0
- PostgreSQL: https://www.postgresql.org/download/windows/
- Node.js: https://nodejs.org/ (скачать LTS)
- Rider: https://www.jetbrains.com/rider/download/

2) Установка и настройка PostgreSQL

1. Установите PostgreSQL через официальный инсталлятор. Во время установки запомните пароль для суперпользователя `postgres`.
2. Создавать базу данных вручную не надо, она создастся сама первичном запуске приложения.

3) Настройка файла конфигурации с credentials

В проекте есть `appsettings.Development.json` (в каталоге `TemplateProject`). Для разработки создайте (или отредактируйте) копию этого файла и заполните секции:

- `ConnectionStrings:Database` — строка подключения к PostgreSQL
- `AdminCredentials`, `OrganizerCredentials`, `UserCredentials`, `QACredentials`, `AnalystCredentials`, `SupportCredentials`, `BackupCredentials` — учетные записи по умолчанию для удобства (email/password)
- `Auth` — ключ, issuer, audience и lifetime
- `SmtpSettings` — параметры SMTP: тут после регистрации на сайте https://www.mailersend.com/ в домене будет вся информация для заполнения этого блока 

Пример содержимого (вставьте в `TemplateProject\appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "Database": "Host=localhost;Port=5432;Database=meetings_db;Username=meetings_user;Password=StrongPassword123!;Include Error Detail=true"
  },
  "AdminCredentials": {
    "Email": "admin@example.local",
    "Password": "Admin123+"
  },
  "OrganizerCredentials": {
    "Email": "organizer@example.local",
    "Password": "Organizer123+"
  },
  "UserCredentials": {
    "Email": "user@example.local",
    "Password": "User123+"
  },
  "QACredentials": {
    "Email": "qa.engineer@example.local",
    "Password": "QaEngineer123+"
  },
  "AnalystCredentials": {
    "Email": "business.analyst@example.local",
    "Password": "Analyst123+"
  },
  "SupportCredentials": {
    "Email": "support.manager@example.local",
    "Password": "Support123+"
  },
  "BackupCredentials": {
    "Email": "backup.organizer@example.local",
    "Password": "BackupOrganizer123+"
  },
  "Auth": {
    "Issuer": "https://localhost:7262",
    "Audience": "https://localhost:5205",
    "Key": "standartsecret_keyfordevelopment!v0_101",
    "Lifetime": "24:00:00"
  },
  "SmtpSettings": {
    "Host": "smtp.mailersend.net",
    "Port": 587,
    "Username": "",
    "Password": ""
  }
}
```

Важно: не храните пароли и секреты в репозиториях в открытом виде для production. Для локальной разработки можно использовать `appsettings.Development.json` или переменные окружения.

4) SSL / HTTPS для бэкенда (локальная разработка)

Для корректной работы аутентификации и внешних браузеров нужно иметь HTTPS. Для разработки достаточно сгенерировать и доверить локальный сертификат.

Способ A — быстро (рекомендуется для разработки):

```powershell
# Установленный .NET SDK предоставляет команду для генерации dev-сертификатов
dotnet dev-certs https --trust

# Убедитесь, что приложение слушает HTTPS URL (проверьте appsettings/launchSettings или переменные окружения ASPNETCORE_URLS)
```

После выполнения команды Windows предложит доверить сертификат. Это покрывает большинство сценариев разработки.

Способ B — создать и использовать собственный .pfx (если нужно):

```powershell
# Создать самоподписанный сертификат и экспортировать в PFX
$pwd = ConvertTo-SecureString -String "CertPassword123!" -Force -AsPlainText
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(2)
Export-PfxCertificate -Cert "Cert:\LocalMachine\My\$($cert.Thumbprint)" -FilePath .\localhost.pfx -Password $pwd

# Затем указать путь к PFX в переменных окружения (пример):
setx ASPNETCORE_Kestrel__Certificates__Default__Path "C:\path\to\project\localhost.pfx"
setx ASPNETCORE_Kestrel__Certificates__Default__Password "CertPassword123!"

# Перезапустите PowerShell/IDE чтобы переменные вступили в силу
```

5) Подготовка и запуск бэкенда

Откройте PowerShell в корне `backend` и выполните:

```powershell
# Перейти в папку проекта
cd C:\Users\damir\RiderProjects\meetings-sign\backend\TemplateProject

# Восстановить пакеты и собрать
dotnet restore
dotnet build

# Установить dotnet-ef, если еще не установлен
dotnet tool install --global dotnet-ef --version 8.* || true

# Миграции применятся автоматически при запуске

# Запустить проект (будет слушать https если настроено)
dotnet run

# Или явно:
dotnet run --urls "https://localhost:7262;http://localhost:5205"
```

Проверьте логи в консоли — приложение должно подняться и подключиться к базе.

6) Фронтенд (общие инструкции)

Фронтенд-папка находится отдельно, выполните внутри неё:

```powershell
# Пример: перейти в frontend
cd frontend
npm install
# Для разработки
npm run dev
```

7) IDE: JetBrains Rider

Рекомендую установить Rider для удобной работы с .NET проектом. После установки откройте `TemplateProject.sln` через Rider. Rider автоматически подхватит конфигурации запуска из `Properties/launchSettings.json`.

8) Полезные советы и отладка

- Если приложение не может подключиться к PostgreSQL — проверьте строку подключения, что PostgreSQL слушает на нужном порту и пользователь/пароль верны.
- Если миграции не применяются — проверьте переменную окружения `ASPNETCORE_ENVIRONMENT` (для `Development` будет использован `appsettings.Development.json`).
- Логи ошибок и стек-трейсы появляются в консоли приложения и в логах.
- Для отправки почты заполните `SmtpSettings` в `appsettings.Development.json`.

9) Пример minimal workflow (короткая последовательность команд)

```powershell
# 1) Запустить PostgreSQL (служба)
# 2) Настроить appsettings.Development.json (строка подключения и credentials)
cd C:\Users\damir\RiderProjects\meetings-sign\backend\TemplateProject
dotnet restore
dotnet ef database update
dotnet run

# Затем в другой консоли запустить фронтенд
cd frontend
npm install
npm run dev
```
---
