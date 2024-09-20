# Лабораторная 1

## Шаг 1 создание pet-проектов

Для начала создадим 2 pet-проекта. В моем случае, первый - это front (одно-страничный сайт на Vite), а второй - это back (fastapi + uvicorn).

У бэкэнда есть единственная ручка /items, которая возвращает перемешанный список из 4 котиков. Пример:

```
`{"id":1,"name":"BigBoy","img":"https://cdn2.thecatapi.com/images/1su.jpg"}`
```

используем CORSMiddleware и даем разрешение фронту обращаться к back

```
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

На front, мы делаем запрос fetchItems() с back каждые 5000мс. 

```
  const fetchItems = () => {
    axios.get('http://127.0.0.1:8000/items').then(r => {
      setItems(r.data)
    })
  }

  useEffect(() => {
    fetchItems()
    setInterval(() => {
      fetchItems()
    }, 5000)
  }, [])

```

## Шаг 2 создание докер файлов для back и front

Для начала напишем докер файлы для упаковки back и front в контейнеры. 

**Back**

```
FROM python:3.11.9-slim

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

CMD [ "python", "main.py" ]
```

Устанавливаем Fastapi и Uvicorn с помощью python, переносим остальные файлы и запускаем main.py

**Front**

```
FROM node:alpine as build

COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /dist /usr/share/nginx/html
COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]
```

Используем node:alpine. Устанавливаем все необходимое из package.json, копируем остальные файлы и запускаем Vite. Далее, в качестве базового образа для контейнера используем Nginx на базе Alpine Linux. Копируем скомпилированные файлы front из промежуточного образа /dist. Копируем пользовательский конфигурационный файл Nginx. Открываем порт 3000. Запускаем Nginx в фоновом режиме. 

Следующий шаг, создаем nginx.conf в папке front

```
server {
  listen 3000;

  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
  }

  include /etc/nginx/extra-conf.d/*.conf;
}
```

Слушаем раннее указанный порт 3000. 

Location

root - то что перенесли раннее из папки /dist. 

index - индексный файл

try_files - для запросов с uri

Позволяем Nginx автоматически включать все файлы с расширением `.conf`

## Шаг 3 создание docker-compose и nginx.conf

docker-compose.yml

```
networks:
  dev:

services:
  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
    volumes:
      - './nginx.conf:/etc/nginx/nginx.conf'
    depends_on:
      - backend
      - frontend
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
```
В services добавляем frontend, backend, nginx. Объединяем в единую сеть -dev.

**nginx.conf**

```
user  root;
worker_processes  1;

events {
}

http {
    server {
        listen       80;
        server_name  localhost; 

        location / {
            proxy_pass http://frontend:3000/;
        }

        location /api/ {
            proxy_pass http://backend:8000/;
        }
    }
}
```
Указываем пользователя root, один рабочий процесс. Слушаем на порте 80, используем localhost

## Шаг 4 создание и настройка сервера

Я решил арендовать сервер у Selectel с самой простой конфигурацией на Ubuntu 24.04 LTS 64-bit, добавил авторизацию через SSH ключ.

**4.1 Устанавливаем git**
```
root@swag:~# sudo apt-get install git
```
**4.2 Устанавливаем docker**

**4.3 Клонируем репозиторий на сервер**

**4.4 Обновляем ip адресы в CORS и для ручки /items на front**

**4.5 Собираем образы и поднимаем контейнеры**

```
root@swag:~/itmo-cloud-services-course/lab1# docker compose up --build
```

## Шаг 5 https и перенаправление с htttp на https

*nginx.conf*
```
    server {
        listen       80;
        listen  [::]:80;
        server_name  valdemir.ru www.valdemir.ru;
        # Redirect all HTTP requests to HTTPS
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        } 
    }

    server {
        listen       443 ssl;
        listen  [::]:443 ssl;
        server_name  valdemir.ru www.valdemir.ru;

        ssl_certificate /etc/letsencrypt/live/valdemir.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/valdemir.ru/privkey.pem;

        location / {
            proxy_pass http://frontend:3000/;
        }

        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

**5.1 Создаем 2 сервера один для http 80, другой для https 443**

В первом перенаправляем запросы на https

```
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        } 
```

Во втором подключаем ssl сертификаты

```
        ssl_certificate /etc/letsencrypt/live/valdemir.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/valdemir.ru/privkey.pem;
```

Для ручки /api добавляем директивы

Эти директивы помогают передать важную информацию о запросе от клиента к проксируемому серверу, что может быть полезно для логирования, аутентификации и других целей.

```
location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
```

**5.2 Обновляем back и front**

```
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:5173",
        # "http://87.228.16.92"
        "https://valdemir.ru",
        "https://www.valdemir.ru"

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**5.3 Добавляем certbot в docker-compose**

```
  certbot:
    image: certbot/certbot
    volumes:
      - '/etc/letsencrypt:/etc/letsencrypt'
      - './certbot/www:/var/www/certbot'
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot certonly --webroot -w /var/www/certbot --email godnestywork@gmail.com --agree-tos --no-eff-email --force-renewal -d valdemir.ru -d www.valdemir.ru; sleep 12h & wait $${!}; done;'"
    networks:
      - dev
```

**5.4 Создаем сертификаты**
```
sudo certbot certonly --standalone -d valdemir.ru -d www.valdemir.ru
```

## Шаг 6 Использовать alias для создания псевдонимов путей к файлам или каталогам на сервере.

**6.1 Создаем папку с файлом 404.html и кладем ее в контейнер с разрешениями**

```
COPY static/404.html /usr/share/nginx/html/404.html

RUN chmod 644 /usr/share/nginx/html/404.html && \
    chown root:root /usr/share/nginx/html/404.html
```

**6.2 В nginx для front добавляем /error для возможности скачивания файла**

```
server {
  root /usr/share/nginx/hmtl;
  listen 3000;

  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
  }

  location /error {
    alias /usr/share/nginx/html/404.html;
    try_files $uri $uri/ /index.html =404;
  }

  include /etc/nginx/extra-conf.d/*.conf;
}
```

## Шаг 7 Настроить виртуальные хосты для обслуживания нескольких доменных имен на одном сервере.

Создадим еще один блок server для доменного имени valdemir.online

```
http {
    # Redirect HTTP to HTTPS
    server {
        listen       80;
        server_name  valdemir.ru www.valdemir.ru valdemir.online www.valdemir.online;

        return 301 https://$host$request_uri;
    }

    server {
        listen       443 ssl;
        # listen  [::]:443 ssl;
        server_name  valdemir.ru www.valdemir.ru;

        ssl_certificate /etc/letsencrypt/live/valdemir.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/valdemir.ru/privkey.pem;

        location / {
            proxy_pass http://frontend:3000/;
        }

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    }

    server {
        listen       443 ssl;
        server_name  valdemir.online www.valdemir.online;

        location /.well-known/acme-challenge/ { 
            root /var/www/certbot; 
        }

        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        ssl_certificate /etc/letsencrypt/live/valdemir.online/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/valdemir.online/privkey.pem;

        location / {
            proxy_pass http://frontend:3000/;
        }

    }
}
```
Не забудем привязать ip сервера в dns