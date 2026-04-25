# KARKAS Testnet — повний стек

PoS EVM L1 + React DApp сайт (Landing / DApps / KRKS Roulette) + VRF Oracle

## Архітектура

```
network.config          ← єдине джерело конфігурації
  ↓
00-init-secrets.sh      ← генерує секрети, пише .env
  ↓
.env                    ← вся конфігурація + секрети (gitignored)
  ↓
docker-compose.yml
  ├── execution         (Geth)
  ├── consensus         (Lighthouse beacon)
  ├── validator         (Lighthouse VC)
  ├── faucet            (Express + React)
  ├── landing           (React SPA — nginx, порт 3000)
  │     ├── /           — лендінг
  │     ├── /dapps      — список DApps
  │     └── /dapps/gembl — KRKS Roulette
  └── oracle            (VRF Oracle для рулетки)
```

---

## Швидкий старт

### 1. Налаштувати мережу

```bash
# Відредагуй network.config (назва, chain ID, домен, порти)
nano network.config
```

### 2. Генерація секретів

```bash
bash scripts/00-init-secrets.sh
```

### 3. Генерація Genesis

```bash
bash scripts/01-generate-genesis.sh
```

### 4. Генерація ключів валідатора

```bash
bash scripts/02-generate-keys.sh
```

### 5. Ініціалізація Geth

```bash
bash scripts/03-init-geth.sh
```

### 6. Копіювання ключів валідатора

```bash
bash scripts/04-init-validator.sh
```

### 7. Запуск стеку

```bash
docker compose up -d
```

Перевірити логи:
```bash
docker compose logs -f landing   # сайт
docker compose logs -f oracle    # VRF oracle
docker compose logs -f faucet    # фасет
```

---

## Деплой рулетки

### A. Налаштувати oracle/.env

```bash
cp oracle/.env.example oracle/.env
nano oracle/.env
# ORACLE_PRIVATE_KEY — свіжий приватний ключ (не власницький!)
# Згенерувати: node -e "const {ethers}=require('ethers'); console.log(ethers.Wallet.createRandom().privateKey)"
```

### B. Задеплоїти контракт

```bash
cd site   # або з кореня
OWNER_PRIVATE_KEY=0x...  \
ORACLE_ADDRESS=<адреса з oracle/.env>  \
SEED_KRKS=50             \
node contracts/deploy.js
```

Скрипт виведе адресу контракту.

### C. Прописати адресу

**1. `site/src/config/network.js`:**
```js
export const ROULETTE_ADDRESS = "0xYourDeployedAddress";
```

**2. `oracle/.env`:**
```
CONTRACT_ADDRESS=0xYourDeployedAddress
```

### D. Перебудувати і перезапустити

```bash
docker compose build landing oracle
docker compose up -d landing oracle
```

Рулетка буде доступна на `/dapps/gembl`.

---

## Чому сайт не піднімався (вирішено)

**Проблема:** nginx був налаштований як `try_files $uri /index.html` — без `$uri/`.
React Router для шляхів `/dapps` і `/dapps/gembl` отримував 404 від nginx замість `index.html`.

**Виправлення:** `try_files $uri $uri/ /index.html;`

---

## Blockscout (опційно)

```bash
cd blockscout
docker compose --env-file ../.env up -d
```

---

## Зупинка

```bash
bash scripts/shutdown.sh
# або
docker compose down
```
