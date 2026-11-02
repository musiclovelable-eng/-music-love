# Music Love — установка на `musiclove-label.ru`

Эта конфигурация предназначена для постоянного VPS, а не для временного туннеля.
Next.js, локальная база libSQL/SQLite, файлы и HTTPS работают на одном сервере.
Supabase и Turso для такого размещения не нужны.

## Что потребуется купить

1. Домен `musiclove-label.ru` (если он ещё свободен на момент заказа).
2. VPS с Ubuntu 24.04 и Docker. Рекомендуемый старт: **2 vCPU, 4 ГБ RAM, 40 ГБ NVMe**.
   Для больших аудиоархивов диск следует увеличить.

Доступ к серверу лучше предоставлять по отдельному SSH-ключу, а не пересылать
постоянный root-пароль в чате.

## DNS

После создания VPS добавить у регистратора две A-записи на его IPv4:

| Имя | Тип | Значение |
| --- | --- | --- |
| `@` | `A` | IPv4 VPS |
| `www` | `A` | IPv4 VPS |

Не добавлять AAAA-запись, если на сервере не настроен рабочий IPv6.
Caddy автоматически получит и будет продлевать HTTPS-сертификаты после того,
как DNS начнёт указывать на VPS.

## Структура на сервере

```text
/opt/music-love/
├── compose.yaml
├── Dockerfile
├── .env.production
├── deploy/Caddyfile
├── scripts/backup-production.sh
└── data/
    ├── music-love.db
    └── storage/
```

Каталог `data` — постоянный том. Его нельзя удалять при обновлении контейнеров.
В него переносится текущая база с Kurmur и администратором; файлы загружаются в
`data/storage`.

## Первый запуск

1. Разместить исходники в `/opt/music-love`.
2. **До запуска** скопировать рабочую базу в `data/music-love.db` и существующие
   файлы (если они есть) в `data/storage`.
3. Создать файл окружения и надёжный секрет сессий:

   ```bash
   cd /opt/music-love
   cp .env.production.example .env.production
   SECRET="$(openssl rand -hex 32)"
   sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" .env.production
   chmod 600 .env.production
   chmod 700 data data/storage
   ```

4. Запустить сайт:

   ```bash
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail=100 app caddy
   ```

5. Проверить:

   ```bash
   curl -fsS https://musiclove-label.ru/api/health
   ```

Ожидаемый ответ: `{"ok":true,"service":"Music Love"}`.
Затем необходимо проверить вход администратора и Kurmur, загрузку обложки/трека,
открытие файла и повторный вход после перезапуска браузера.

## Почта и интеграции

Существующие учётные записи работают без SMTP. Для кодов подтверждения при новой
регистрации нужно заполнить `MAIL_*` в `.env.production`. Telegram и AI-ключи
необязательны. После изменения `.env.production`:

```bash
docker compose up -d --force-recreate app
```

## Резервные копии

Скрипт делает согласованную SQLite-копию без остановки сайта, архив файлов и
SHA-256 контрольные суммы. Срок хранения — 14 дней.

```bash
mkdir -p /opt/music-love-backups
APP_DIR=/opt/music-love BACKUP_DIR=/opt/music-love-backups \
  /opt/music-love/scripts/backup-production.sh
```

Пример ежедневного запуска в 03:00 по времени сервера:

```cron
0 3 * * * APP_DIR=/opt/music-love BACKUP_DIR=/opt/music-love-backups /opt/music-love/scripts/backup-production.sh >> /var/log/music-love-backup.log 2>&1
```

Резервные копии также следует периодически забирать на другое устройство или в
объектное хранилище: копия на том же диске не защищает от отказа всего VPS.

## Обновление

```bash
cd /opt/music-love
APP_DIR=/opt/music-love BACKUP_DIR=/opt/music-love-backups \
  ./scripts/backup-production.sh
docker compose up -d --build app
docker compose ps
curl -fsS https://musiclove-label.ru/api/health
```

Не выполнять `docker compose down -v`: флаг `-v` удаляет HTTPS-данные, а при
ошибочном удалении каталога `data` будут потеряны база и файлы.
