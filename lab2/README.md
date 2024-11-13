# Лабораторная 2

## Шаги 1-3. Написать “плохой” Dockerfile, в котором есть не менее трех “bad practices” по написанию докерфайлов. Написать “хороший” Dockerfile, в котором эти плохие практики исправлены. В Readme описать каждую из плохих практик в плохом докерфайле, почему она плохая и как в хорошем она была исправлена, как исправление повлияло на результат.

### BadPractice 1 : Использование неофициального Docker образа. Использование неопределенной версии node. Использование полноценной ОС(большой размер и более небезопасно)

**неофициальный докер-образ**
```
FROM someuser/custom-ubuntu:latest

RUN apt-get update && apt-get install -y \
    node \
    && rm -rf /var/lib/apt/lists/*
```
**неопределенная версия**
```
FROM node
```
**полноценная ОС**
```
FROM node:17.0.1
```
**правильное использование**
```
FROM node:17.0.1-alpine
```

### BadPractice 2 : Неиспользование кэширования слоев докер контейнера(повторная устнановка зависимостей)

```
FROM node:16-alpine

WORKDIR /app

COPY myapp /app

RUN npm install

CMD ["nginx", "-g", "daemon off;"]
```

Первые 2 строчки восстанавливаются из кэша, однако при изменении любой строчки кода, при копировании myapp
восстановление с кэша отменится для всех следующих слоев, поэтому зависимости будут установлены заново

**правильное использование**

```
FROM node:16-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY ..

CMD ["nginx", "-g", "daemon off;"]
```

Теперь отмена восстановления из кэша произойдет только если что-то изменится в зависимостях
файлы package.json package-lock.json

### BadPractice 3 : Хранение лишних файлов в контейнере

не использование .dockerignore
оставляется например:

- git
- cache
- *.md
- settings.json

.dockerignore
```
.git
.cache

*.md

settings.json
```

## Шаг 4. В Readme описать 2 плохих практики по работе с контейнерами! Не по написанию докерфайлов, а о том, как даже используя хороший докерфайл можно накосячить именно в работе с контейнерами.

### BadPractice 1 : Права доступа для работы с контейнером

Добавление прав

```
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### BadPractice 2 : Большое количество контейнеров

Запуск большого количества контейнеров без должного мониторинга и управления может привести к проблемам с производительностью и ресурсами. Для решения этой проблемы, можно воспользоваться Kubernetes 

### BadPractice 3 : Отсутствие логирования и мониторинга

Запуск контейнеров без настройки логирования и мониторинга делает сложным отслеживание их состояния и диагностику проблем. Для решения этой проблемы, можно воспользоваться Prometheus и Grafana для мониторинга и  ELK Stack для логирования

# Лабораторная 2 *

## Шаги 1-3. Написать “плохой” Docker compose file, в котором есть не менее трех “bad practices” по написанию докерфайлов. Написать “хороший” Docker compose file, в котором эти плохие практики исправлены. В Readme описать каждую из плохих практик в плохом докерфайле, почему она плохая и как в хорошем она была исправлена, как исправление повлияло на результат.

**неправильный docker-compose**

```
version: '3.8'

services:
  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
      - "443:443"
    restart: always
    volumes:
      - nginx.conf:/etc/nginx/nginx.conf:ro
      - etc/letsencrypt:/etc/letsencrypt:ro
      - certbot/www:/var/www/certbot/:ro
    depends_on:
      - certbot
    networks:
      - dev
  certbot:
    image: certbot/certbot
    volumes:
      - etc/letsencrypt:/etc/letsencrypt:ro
      - certbot/www:/var/www/certbot/:ro
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot certonly --webroot -w /var/www/certbot --email godnestywork@gmail.com --agree-tos --no-eff-email --force-renewal -d valdemir.ru -d www.valdemir.ru -d valdemir.online -d www.valdemir.online; sleep 12h & wait $${!}; done;'"
    networks:
      - dev

  backend:
    build:
      context: ./backend
    networks:
      - dev

  frontend:
    build:
      context: ./frontend
    networks:
      - dev

networks:
  dev:
```

### BadPractice 1 : Не делать проверку работоспособности сервисов внтури docker-compose

healthcheck помогает убедиться что контейнеры работают правильно и делает автоматически рестарт неработающего сервиса

```
services:
  nginx:
    image: nginx:stable-alpine
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 1m30s
      timeout: 10s
      retries: 3
```

### BadPractice 2 : Использовать жестко закодированные volumes

Такая практика может обернуться тем, что при изменении одного из путей, можно забыть поменять их везде. Именованные тома обеспечивают сохранение данных даже в случае удаления или пересоздания контейнера.
Volumes nginx_conf, letsencrypt и certbot_www обеспечивают сохранение конфигурационных файлов и сертификатов при перезапуске контейнеров. Эти тома можно легко создавать резервные копии и восстанавливать, что упрощает перенос данных между средами. Тома обеспечивают уровень изоляции, предотвращая случайные изменения файловой системы хоста. Тома определены на верхнем уровне и используются в сервисах, что упрощает конфигурацию

```
version: '3.8'

services:
  nginx:
    image: nginx:stable-alpine
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 1m30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: "512M"
    ports:
      - "80:80"
      - "443:443"
    restart: always
    volumes:
      - nginx.conf:/etc/nginx/nginx.conf:ro
      - etc/letsencrypt:/etc/letsencrypt:ro
      - certbot/www:/var/www/certbot/:ro
    depends_on:
      - certbot
    networks:
      - dev
    env_file:
      - .env
    command: /bin/sh -c "envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"

volumes:
  nginx_conf:
  letsencrypt:
  certbot_www:
```

### BadPractice 3 : Не иметь ограничения мощностей сервисов

Это может привести к утечки памяти и вычислительной мощности

```
services:
  nginx:
    image: nginx:stable-alpine
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: "512M"
```

**правильный docker-compose**

```
version: '3.8'

services:
  nginx:
    image: nginx:stable-alpine
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 1m30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: "512M"
    ports:
      - "80:80"
      - "443:443"
    restart: always
    volumes:
      - nginx.conf:/etc/nginx/nginx.conf:ro
      - etc/letsencrypt:/etc/letsencrypt:ro
      - certbot/www:/var/www/certbot/:ro
    depends_on:
      - certbot
    networks:
      - dev
    env_file:
      - .env
    command: /bin/sh -c "envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"

  certbot:
    image: certbot/certbot
    volumes:
      - letsencrypt:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot certonly --webroot -w /var/www/certbot --email godnestywork@gmail.com --agree-tos --no-eff-email --force-renewal -d valdemir.ru -d www.valdemir.ru -d valdemir.online -d www.valdemir.online; sleep 12h & wait $${!}; done;'"
    networks:
      - dev

  backend:
    build:
      context: ./backend
    networks:
      - dev

  frontend:
    build:
      context: ./frontend
    networks:
      - dev

volumes:
  nginx_conf:
  letsencrypt:
  certbot_www:

networks:
  dev:
```
