# Лабораторная 3

Обычная: 
1. Написать “плохой” CI/CD файл, который работает, но в нем есть не менее пяти “bad practices” по написанию CI/CD
2. Написать “хороший” CI/CD, в котором эти плохие практики исправлены
3. В Readme описать каждую из плохих практик в плохом файле, почему она плохая и как в хорошем она была исправлена, как исправление повлияло на результат

Как работает CI/CD в моем проекте? 
Главный файл находится здесь .githib/workflows/CiCdApplication.yaml
Он отвечает за сборку приложения и делигирует обязанности шаблону build-sample.yml, при push или pull_request в main ветку.

build-sample.yml может запускаться только при workflow_call и 

f




1) Не указано имя Workflow. Это не удобно при просмотре action, потому что используется путь до файла.
```
on:
  push:
    branches:
      - main
  paths:
    - 'lab3/CiCdApplication/**'
...
```
Решение
```
name: Scheduled Builds

on:
```
2) Изменение прав в job
```
      - name: Change wrapper permissions
        run: chmod +x ./gradlew
```
Решение
```
chmod +x ./gradlew в репозитории и коммит ./gradlew
```
3) Не используется schedule вместо on action, что приводит к лишним вызовам.
```
  on:
  push:
    branches:
      - main
```
Решение
```
on:
  schedule:
    - cron: '0 12 * * *' # Каждый день в 12:00
```
4) В качестве директории для всех jobs указана lab3/CiCdApplication, это может быть неудобно при добавлении новых job, так как придется изменять пути.
```
defaults:
  run: 
    working-directory: lab3/CiCdApplication
...
```
Решение
```
steps:
  - name: Change wrapper permissions
    working-directory: lab3/CiCdApplication
    run: chmod +x ./gradlew
  - name: Build 
    working-directory: lab3/CiCdApplication
    run: ./gradlew build assembleRelease
```
5) Условиe if: ${{ success() }} - лишнее, так как наличие needs: build подразумевает успешное выполнение
```
  release:
    if: ${{ success() }}
    needs: build
```
Решение:
```
  release:
    needs: build
```
6) Разделение build и release на разные jobs увеличивает время работы в 2 раза,так как это разные артефакты раннера, сборщику gradle необходимо заново ставить зависимости для проекта. Добавление кэширования увеличивает время работы в 4-5 раз(для стартового проекта)
```
jobs:
  build:

  release:
```
Решение:
```
  jobs:
    build-and-realese:
```

Готовое решение:

```
name: Scheduled Builds

on:
  schedule:
    - cron: '0 12 * * *' # Каждый день в 12:00

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: 'adopt'
      - name: Build 
        working-directory: lab3/CiCdApplication
        run: ./gradlew build assembleRelease
      - name: Upload APK
        if: success()
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: lab3/CiCdApplication/app/build/outputs/apk/release/app-release.apk
      - name: Notify Build Success
        if: success()
        run: echo "Build succeeded!" 

```

