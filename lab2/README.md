# Лабораторная 2

## Шаги 1-3. Написать “плохой” Dockerfile, в котором есть не менее трех “bad practices” по написанию докерфайлов. Написать “хороший” Dockerfile, в котором эти плохие практики исправлены. В Readme описать каждую из плохих практик в плохом докерфайле, почему она плохая и как в хорошем она была исправлена, как исправление повлияло на результат.

### BadPractice 1 : Использование неофициального Docker образа. Использование неопределенной версии node. Использование полноценной ОС(большой размер и более небезопасно)

**неофициальный докер-образ**
```
FROM ubuntu

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
