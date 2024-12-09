# Лабораторная 3

Обычная: 
1. Написать “плохой” CI/CD файл, который работает, но в нем есть не менее пяти “bad practices” по написанию CI/CD
2. Написать “хороший” CI/CD, в котором эти плохие практики исправлены
3. В Readme описать каждую из плохих практик в плохом файле, почему она плохая и как в хорошем она была исправлена, как исправление повлияло на результат

Как работает CI/CD в моем проекте? 
Главный файл находится здесь .githib/workflows/CiCdApplication.yaml
Он отвечает за сборку приложения и делегирует обязанности шаблону build-sample.yml, при push или pull_request в main ветку.

```
name: CiCdApplication

on:
  push:
    branches:
     - main
    paths:
      - '.github/workflows/CiCdApplication.yaml'
      - 'lab3/CiCdApplication/**'
  pull_request:
    paths:
      - '.github/workflows/CiCdApplication.yaml'
      - 'lab3/CiCdApplication/**'
  workflow_dispatch:
  
jobs:
  build:  
    uses: ./.github/workflows/build-sample.yml
    with:
      name: CiCdApplication
      path: lab3/CiCdApplication
      module: app
    secrets:
      compose_store_password: ${{ secrets.COMPOSE_STORE_PASSWORD }}
      compose_key_alias: ${{ secrets.COMPOSE_KEY_ALIAS }}
      compose_key_password: ${{ secrets.COMPOSE_KEY_PASSWORD }}
```

build-sample.yml может запускаться только при workflow_call, например вызовом из CiCdApplication.yaml с помощью uses.

Рассмотрим файл build-sample.yml с плохими практиками

```
name: Build and Test Sample

on:
  workflow_call:
    inputs:
      name:
        required: true
        type: string
      path:
        required: true
        type: string
      module:
        default: "app"
        type: string
    secrets:
      compose_store_password:
        description: 'password for the keystore'
        required: true
      compose_key_alias:
        description: 'alias for the keystore'
        required: true
      compose_key_password:
        description: 'password for the key'
        required: true
env:
  compose_store_password: ${{ secrets.compose_store_password }}
  compose_key_alias: ${{ secrets.compose_key_alias }}
  compose_key_password: ${{ secrets.compose_key_password }}
jobs:
  build:
    runs-on: ubuntu-latest 
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Copy CI gradle.properties
        run: mkdir -p ~/.gradle ; cp .github/ci-gradle.properties ~/.gradle/gradle.properties

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: 'zulu'
      - name: Make checksum script executable
        run: chmod +x ./scripts/checksum.sh
      - name: Generate cache key
        run: ./scripts/checksum.sh ${{ inputs.path }} checksum.txt

      - uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches/modules-*
            ~/.gradle/caches/jars-*
            ~/.gradle/caches/build-cache-*
          key: gradle-${{ hashFiles('checksum.txt') }}

      - name: Check formatting
        working-directory: ${{ inputs.path }}
        run: ./gradlew --init-script buildscripts/init.gradle.kts spotlessCheck --stacktrace

      - name: Check lint
        working-directory: ${{ inputs.path }}
        run: ./gradlew lintDebug --stacktrace

      - name: Build debug
        working-directory: ${{ inputs.path }}
        run: ./gradlew assembleDebug --stacktrace
      - name: Enable KVM group perms
        run: |
            echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
            sudo udevadm control --reload-rules
            sudo udevadm trigger --name-match=kvm
      - name: Run local tests
        working-directory: ${{ inputs.path }}
        run: ./gradlew testDebug --stacktrace

      - name: Upload build outputs (APKs)
        uses: actions/upload-artifact@v4
        with:
          name: build-outputs
          path: ${{ inputs.path }}/${{ inputs.module }}/build/outputs

      - name: Upload build reports
        uses: actions/upload-artifact@v4
        with:
          name: build-reports
          path: ${{ inputs.path }}/${{ inputs.module }}/build/reports
```

1) Использование не конкретной версии ubuntu-latest, это может привести к непредсказуемым ошибкам.

```
build:
  runs-on: ubuntu-latest
```

fix
```
build:
  runs-on: ubuntu-22.04
```

2) Не учитывается вариант бесконечного выполнения для job build. Это может привести к лишнему использованию ресурсов runner.

```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
```

fix
```
jobs:
  build:
    runs-on: ubuntu-22.04
    timeout-minutes: 30
    steps:
```

3) При ошибке в шаге до "Upload build reports", произойдет отмена выполнения этого шага.

```
- name: Upload build reports
  uses: actions/upload-artifact@v4
  with:
    name: build-reports
    path: ${{ inputs.path }}/${{ inputs.module }}/build/reports
```

Можно использовать if: always() - для выполнения вне зависимости от результата выполнения шага

fix
```
- name: Upload build reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: build-reports
    path: ${{ inputs.path }}/${{ inputs.module }}/build/reports
```

4) Не учитывать возможность вызова job во время прогресса сборки текущей job

Это гарантирует, что если новая job запускается в той же ветке (например, main), то текущие выполняемые jobs для этой ветки будут отменены.

```
on:
  workflow_call:
    inputs:
      name:
        required: true
        type: string
      path:
        required: true
        type: string
      module:
        default: "app"
        type: string
    secrets:
      compose_store_password:
        description: 'password for the keystore'
        required: true
      compose_key_alias:
        description: 'alias for the keystore'
        required: true
      compose_key_password:
        description: 'password for the key'
        required: true
jobs:
  ...
```

fix
```
on:
  workflow_call:
    inputs:
      name:
        required: true
        type: string
      path:
        required: true
        type: string
      module:
        default: "app"
        type: string
    secrets:
      compose_store_password:
        description: 'password for the keystore'
        required: true
      compose_key_alias:
        description: 'alias for the keystore'
        required: true
      compose_key_password:
        description: 'password for the key'
        required: true
concurrency:
  group: ${{ inputs.name }}-build-${{ github.ref }}
  cancel-in-progress: true
```

5) Изменение прав доступа к файлу в job

```
- name: Make checksum script executable
  run: chmod +x ./scripts/checksum.sh
```

fix: Выполняем команду в среде разработки и убираем эти строчки

Перейдем к файлу .github/workflows/CiCdApplication.yaml

```
name: CiCdApplication

on:
  push:
    branches:
     - main
  pull_request:
    branches:
     - main
  workflow_dispatch:
  
jobs:
  build:  
    uses: ./.github/workflows/build-sample.yml
    with:
      name: CiCdApplication
      path: lab3/CiCdApplication
      module: app
    secrets:
      compose_store_password: ${{ secrets.COMPOSE_STORE_PASSWORD }}
      compose_key_alias: ${{ secrets.COMPOSE_KEY_ALIAS }}
      compose_key_password: ${{ secrets.COMPOSE_KEY_PASSWORD }}
```

6) Не указаны пути отслеживаемых директорий для вызова GithubAction

```
on:
  push:
    branches:
     - main
  pull_request:
    branches:
     - main
  workflow_dispatch:
```

fix
```
on:
  push:
    branches:
     - main
    paths:
      - '.github/workflows/CiCdApplication.yaml'
      - 'lab3/CiCdApplication/**'
  pull_request:
    paths:
      - '.github/workflows/CiCdApplication.yaml'
      - 'lab3/CiCdApplication/**'
  workflow_dispatch:
```
Указание путей сможет помочь избежать лишних вызовов CiCdApplication.yml

Готовые файлы

.github/workflows/CiCdApplication.yaml
```
name: CiCdApplication

on:
  push:
    branches:
     - main
    paths:
      - '.github/workflows/CiCdApplication.yaml'
      - 'lab3/CiCdApplication/**'
  pull_request:
    paths:
      - '.github/workflows/CiCdApplication.yaml'
      - 'lab3/CiCdApplication/**'
  workflow_dispatch:
  
jobs:
  build:  
    uses: ./.github/workflows/build-sample.yml
    with:
      name: CiCdApplication
      path: lab3/CiCdApplication
      module: app
    secrets:
      compose_store_password: ${{ secrets.COMPOSE_STORE_PASSWORD }}
      compose_key_alias: ${{ secrets.COMPOSE_KEY_ALIAS }}
      compose_key_password: ${{ secrets.COMPOSE_KEY_PASSWORD }}
```

.github/workflows/build-sample.yml
```
name: Build and Test Sample

on:
  workflow_call:
    inputs:
      name:
        required: true
        type: string
      path:
        required: true
        type: string
      module:
        default: "app"
        type: string
    secrets:
      compose_store_password:
        description: 'password for the keystore'
        required: true
      compose_key_alias:
        description: 'alias for the keystore'
        required: true
      compose_key_password:
        description: 'password for the key'
        required: true
concurrency:
  group: ${{ inputs.name }}-build-${{ github.ref }}
  cancel-in-progress: true
env:
  compose_store_password: ${{ secrets.compose_store_password }}
  compose_key_alias: ${{ secrets.compose_key_alias }}
  compose_key_password: ${{ secrets.compose_key_password }}
jobs:
  build:
    runs-on: ubuntu-22.04
    timeout-minutes: 30
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Copy CI gradle.properties
        run: mkdir -p ~/.gradle ; cp .github/ci-gradle.properties ~/.gradle/gradle.properties

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: 'zulu'
      - name: Make checksum script executable
        run: chmod +x ./scripts/checksum.sh
      - name: Generate cache key
        run: ./scripts/checksum.sh ${{ inputs.path }} checksum.txt

      - uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches/modules-*
            ~/.gradle/caches/jars-*
            ~/.gradle/caches/build-cache-*
          key: gradle-${{ hashFiles('checksum.txt') }}

      - name: Check formatting
        working-directory: ${{ inputs.path }}
        run: ./gradlew --init-script buildscripts/init.gradle.kts spotlessCheck --stacktrace

      - name: Check lint
        working-directory: ${{ inputs.path }}
        run: ./gradlew lintDebug --stacktrace

      - name: Build debug
        working-directory: ${{ inputs.path }}
        run: ./gradlew assembleDebug --stacktrace
      - name: Enable KVM group perms
        run: |
            echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
            sudo udevadm control --reload-rules
            sudo udevadm trigger --name-match=kvm
      - name: Run local tests
        working-directory: ${{ inputs.path }}
        run: ./gradlew testDebug --stacktrace

      - name: Upload build outputs (APKs)
        uses: actions/upload-artifact@v4
        with:
          name: build-outputs
          path: ${{ inputs.path }}/${{ inputs.module }}/build/outputs

      - name: Upload build reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: build-reports
          path: ${{ inputs.path }}/${{ inputs.module }}/build/reports
```
