export const STORAGE_KEYS = {
  wishes:   "wishlist_state",
  defi:     "defi_positions_v5",
  hw:       "defi_hw",
  way:      "way-to-1m-v1",
  networth: "networth_v1",
};

export const NW_INITIAL = [
  { month: "2026-01", rate: 76,    nwRub: 26070000, nwUsd: 343026, assets: { kv: 16000000, avto: 6000000, sklad: 15000000, crypto: 8000  }, liabilities: { ipoteka: 11358000, credit: 180000 } },
  { month: "2026-02", rate: 78.19, nwRub: 26266900, nwUsd: 335937, assets: { kv: 16000000, avto: 6000000, sklad: 15000000, crypto: 10000 }, liabilities: { ipoteka: 11355000, credit: 160000 } },
  { month: "2026-03", rate: 78,    nwRub: 27056000, nwUsd: 346872, assets: { kv: 18000000, avto: 5000000, sklad: 15000000, crypto: 7000  }, liabilities: { ipoteka: 11350000, credit: 140000 } },
  { month: "2026-04", rate: 77,    nwRub: 27075000, nwUsd: 351623, assets: { kv: 18000000, avto: 5000000, sklad: 15000000, crypto: 7000  }, liabilities: { ipoteka: 11344000, credit: 120000 } },
  { month: "2026-05", rate: 74,    nwRub: 27080000, nwUsd: 365946, assets: { kv: 18000000, avto: 5000000, sklad: 15000000, crypto: 7000  }, liabilities: { ipoteka: 11338000, credit: 100000 } },
];

export const SYNC_URL   = "https://data-sync.dimitriyak.workers.dev";
export const SYNC_TOKEN = "sync_68569e506ae8f1f6eb250dd4d0dfe081";

export const WISH_CATEGORIES = [
  { id: "health", icon: "🏥", title: "Здоровье", color: "#fc5c7d", items: ["Жировик удалить","Зуб имплант","Режим сна — спать по 8 часов","Бросить курить","Укреплять мышцы для падела","Красивое тело без пивного живота"] },
  { id: "personal", icon: "🪞", title: "Личное", color: "#5cfcb8", items: ["Фотосессия для аватарки","Татуировка — рукав, грудь"] },
  { id: "family", icon: "🏠", title: "Семья", color: "#5cbffc", items: ["Дом для родителей в Питере","Квартира 100м² — 40 млн","Ребёнок","Путешествия 1 раз в квартал","2 авто в семье"] },
  { id: "hobbies", icon: "🎿", title: "Увлечения", color: "#fc5cf0", items: ["Падел — выиграть категорию Б","Ракетка, форма для падела","Сноуборд Сочи/Шерегеш","Экипа для сноуборда","Турнир покер","Комп для стримов","Наушники AirPods","Logitech G PRO X Wireless"] },
  { id: "bigthink", icon: "🚀", title: "Мышление по-крупному", color: "#fc8a5c", items: ["Идея со стартапами — телепорт в новый мир","Крипта: развиваться, зарабатывать, не складывать яйца в одну корзину"] },
];

export const DEFI_INITIAL = [
  { id: 1, protocol: "Morpho",       network: "Base",         asset: "USDC",       invested: 400, current: 0, apy: 0, status: "active", type: "lending", color: "#7C5CFC", date: "2026-06-12" },
  { id: 2, protocol: "Aerodrome",    network: "Base",         asset: "USDC/WETH",  invested: 400, current: 0, apy: 0, status: "active", type: "lp",      color: "#5D7EFD", matchId: "aero-usdc-weth", date: "2026-06-13", costBasis: [{ t: "WETH", qty: 0.12, p0: 1666.89 }] },
  { id: 10,protocol: "Aerodrome",    network: "Base",         asset: "USDC/AERO",  invested: 186, current: 0, apy: 0, status: "active", type: "lp",      color: "#5D7EFD", matchId: "aero-usdc-aero", date: "2026-06-15", costBasis: [{ t: "AERO", qty: 229.7, p0: 0.376 }] },
  { id: 3, protocol: "Aave",         network: "Ethereum",     asset: "WBTC",       invested: 295, current: 0, apy: 0, status: "active", type: "btcfi",   color: "#00E5FF", matchId: "aave-eth-wbtc", date: "2026-06-13", costBasis: [{ t: "WBTC", qty: 0.0046, p0: 64176.69 }] },
  { id: 4, protocol: "Aave",         network: "Ethereum",     asset: "USDC (долг)",invested: 0,   current: 0, apy: 0, status: "active", type: "debt",    color: "#FF6450", matchId: "aave-eth-usdc-debt", date: "2026-06-13" },
  { id: 5, protocol: "Hyperliquid",  network: "Hyperliquid",  asset: "USDC (HLP)", invested: 119.5, current: 0, apy: 0, status: "active", type: "vault",   color: "#25BCFE", matchId: "hl-", date: "2026-06-13" },
  { id: 6, protocol: "Lighter",      network: "Lighter",      asset: "Public Pools",invested: 200, current: 0, apy: 0, status: "active", type: "vault",   color: "#4B8BFF", matchId: "lighter-public-pools", date: "2026-06-14" },
  { id: 8, protocol: "Loopscale",    network: "Solana",       asset: "ONyc + Earn",invested: 431, current: 0, apy: 0, status: "active", type: "vault",   color: "#6C63FF", matchId: "loopscale-loops", date: "2026-06-14" },
  { id: 9, protocol: "Kodiak",       network: "Berachain",    asset: "WETH/WBERA", invested: 209, current: 0, apy: 0, status: "active", type: "lp",      color: "#38A7FE", matchId: "kodiak-bault-weth-wbera", date: "2026-06-14", costBasis: [{ t: "WETH", qty: 0.0593, p0: 1658.71 }, { t: "WBERA", qty: 442.09, p0: 0.2495 }] },
];

export const WAY_INITIAL = {
  milestones: [
    { id: "m1", amount: 10000,   label: "10K $",  reached: false },
    { id: "m2", amount: 50000,   label: "50K $",  reached: false },
    { id: "m3", amount: 100000,  label: "100K $", reached: false },
    { id: "m4", amount: 250000,  label: "250K $", reached: false },
    { id: "m5", amount: 500000,  label: "500K $", reached: false },
    { id: "m6", amount: 1000000, label: "1M $",   reached: false },
  ],
  currentAmount: 0,
  tasks: [],
  log: [],
};

export const DEFI_WEEKS = [
  {
    week: 0,
    title: "Подготовка",
    tasks: [
      {
        text: "Настроить интеграцию с Claude через API — обновление дашборда из чата",
        description: "Это нулевая неделя — техническая подготовка самого дашборда. Цель: чтобы ты мог писать мне в чат и я обновлял данные напрямую. Пока просто отметь как выполнено если дашборд уже работает.",
      },
    ],
  },
  {
    week: 1,
    title: "Фундамент",
    tasks: [
      { text: "Установить Rabby Wallet", description: "Rabby — браузерное расширение-кошелёк, лучше MetaMask для DeFi. Его главный плюс: перед каждой транзакцией он показывает человекочитаемым языком что именно ты подписываешь — например 'одобрить списание 400 USDC с адреса X'. Это защита от фишинга и вредоносных сайтов. Как установить: зайди на rabby.io → Download → добавь расширение в Chrome/Brave. Создай новый кошелёк или импортируй существующий через seed-фразу. Если уже работаешь с MetaMask — можно продолжать с ним, Rabby не обязателен." },
      { text: "Добавить сеть Base", description: "Base — быстрая и дешёвая сеть от Coinbase, работает поверх Ethereum. Здесь будут наши основные позиции: Aave и Aerodrome. Комиссии копеечные — буквально $0.01 за транзакцию вместо $5–20 на Ethereum. Как добавить: зайди на chainlist.org → в поиске напечатай 'Base' → нажми 'Add to MetaMask' (или Rabby — кнопка та же). Подтверди добавление в расширении. После этого в кошельке появится возможность переключиться на сеть Base." },
      { text: "Добавить сеть Arbitrum", description: "Arbitrum — ещё один L2 Ethereum с низкими комиссиями и большой DeFi экосистемой. Здесь живут GMX (торговля с плечом) и другие протоколы из нашего плана. Как добавить: зайди на chainlist.org → в поиске напечатай 'Arbitrum One' → нажми 'Add to MetaMask/Rabby' → подтверди. Готово — теперь можно переключаться между сетями в кошельке." },
      { text: "Добавить сеть Optimism", description: "Optimism — L2 сеть Ethereum, хорошо известна проектами Velodrome и Synthetix. Комиссии такие же низкие как на Base. Как добавить: зайди на chainlist.org → поиск 'OP Mainnet' → 'Add to MetaMask/Rabby' → подтверди. Теперь у тебя в кошельке три рабочих сети: Ethereum (дорогой), Base и Arbitrum (дешёвые)." },
      { text: "Включить 2FA на Bybit", description: "2FA (двухфакторка) — второй уровень защиты аккаунта. Даже если кто-то узнает твой пароль — без кода из приложения войти не сможет. Используй Google Authenticator или Authy — не SMS (SMS перехватывают через подмену симки). Как включить на Bybit: зайди в аккаунт → верхний правый угол → Account & Security → Two-Factor Authentication → Google Authenticator → сканируй QR-код приложением → введи 6-значный код для подтверждения. Сохрани backup-коды в надёжном месте." },
      { text: "Записать seed-фразу на бумагу", description: "Seed-фраза (12 или 24 слова) — это абсолютный контроль над кошельком. Кто знает эти слова — тот владеет всеми средствами внутри, без возможности оспорить. Как найти в Rabby: Settings → Управление кошельком → Show Secret Recovery Phrase. В MetaMask: три точки → Security & Privacy → Reveal Secret Recovery Phrase. Запиши все слова по порядку на бумагу. Никогда: не фотографировать, не хранить в облаке (Google Фото, iCloud), не отправлять в мессенджерах. Лучше сделай два бумажных экземпляра и храни в разных местах." },
      { text: "Открыть DeFiLlama и изучить основные разделы", description: "DeFiLlama (defillama.com) — главный агрегатор данных DeFi, бесплатный и без регистрации. Что смотреть: главная страница показывает TVL (сколько денег заблокировано) в каждом протоколе — это мерило доверия рынка. Раздел Yields — доходность по всем протоколам и сетям. Раздел Hacks — все взломы с суммами. Поставь в закладки — будешь заходить каждый раз перед входом в новый протокол." },
      { text: "В DeFiLlama найти APY по USDC на Aave Base и записать", description: "Это упражнение на навигацию по DeFiLlama. Заходи: defillama.com/yields → в строке поиска напечатай 'USDC' → в результатах найди строку где Project = 'Aave V3' и Chain = 'Base'. Посмотри колонку APY — это текущая ставка по USDC на Aave. Запомни или запиши цифру — она нужна для сравнения с другими протоколами на следующей неделе. Нормальный диапазон: 6–15% годовых." },
      { text: "Проверить раздел Hacks на DeFiLlama", description: "Это обязательная проверка безопасности перед входом в любой протокол. Заходи: defillama.com/hacks — здесь список всех зафиксированных взломов с датами и суммами. Найди в списке Aave и Aerodrome — убедись что последний взлом был давно (если вообще был) и с тех пор протокол продолжает работать. Правило: если протокол взломали больше года назад и он продолжает работать — баг исправлен, это нормально. Свежий взлом (последние 1–3 месяца) — повод повременить с входом." },
      { text: "Подписаться в X на @DefiIgnas и @0xngmi", description: "Два обязательных аккаунта для понимания DeFi рынка. @DefiIgnas пишет разборы протоколов, сравнивает стратегии и объясняет новые механики — читается легко даже без глубоких знаний. @0xngmi — создатель DeFiLlama, публикует данные и аналитику по рынку. Как подписаться: зайди в X (Twitter) → в поиске напечатай @DefiIgnas → Follow. Повтори для @0xngmi. Можно добавить их в отдельный список 'DeFi' чтобы не терять в ленте." },
      { text: "Прочитать про Impermanent Loss (непостоянные потери)", description: "Impermanent Loss — главный риск при предоставлении ликвидности в пулы. Простым языком: ты вложил $200 ETH + $200 USDC в пул. ETH вырос в 2 раза. Пул автоматически 'продавал' твой ETH по мере роста чтобы сохранять баланс 50/50. В итоге при выходе у тебя окажется меньше ETH чем если бы ты просто держал. Это и есть IL. Хорошая статья с примерами и графиками: finematics.com/impermanent-loss-explained — читается за 10 минут. Важно: при высоком APY (30–60%) IL обычно окупается за несколько недель." },
      { text: "Посчитать IL на калькуляторе при падении ETH на 50%", description: "Практика важнее теории. Зайди на dailydefi.org/tools/impermanent-loss-calculator. Введи данные: текущая цена ETH (посмотри на coinmarketcap.com), новая цена = текущая × 0.5 (минус 50%), пропорция токенов = 50/50. Нажми Calculate. Ты увидишь процент IL — обычно около 5–6% при падении на 50%. Это не катастрофа — просто нужно понимать что при входе в LP позицию ты принимаешь этот риск в обмен на APY." },
    ],
  },
  {
    week: 2,
    title: "Lending $400",
    tasks: [
      { text: "Перевести $400 USDC на сеть Base", description: "Сначала скопируй адрес своего кошелька — в Rabby/MetaMask нажми на адрес вверху, он скопируется в буфер. Теперь на Bybit: Assets → Withdraw → в поиске токена напечатай USDC → выбери его → в поле Network обязательно выбери BASE (не ERC-20, не BSC — именно Base). Вставь адрес кошелька → введи сумму $400 → Submit. Подтверди через 2FA. Перевод занимает 1–5 минут. Как проверить что деньги пришли: в Rabby переключись на сеть Base — увидишь баланс USDC. Или зайди на basescan.org и вставь адрес своего кошелька." },
      { text: "Зайти на app.aave.com → выбрать Base → Supply USDC", description: "Открой app.aave.com в браузере где установлен Rabby/MetaMask. В правом верхнем углу нажми Connect Wallet → выбери Rabby или MetaMask → подтверди в расширении. Убедись что выбрана сеть Base (переключается в Rabby или прямо на сайте Aave — кнопка с названием сети вверху). В списке активов найди USDC → нажми Supply → введи сумму (можно нажать Max) → нажми Supply снова → в Rabby появится запрос на транзакцию → подтверди. Первый раз потребуется два шага: Approve (разрешение) + Supply. Обе транзакции обойдутся в копейки — меньше $0.05 суммарно." },
      { text: "Сделать скриншот позиции и записать APY", description: "После Supply ты попадёшь на страницу Dashboard на Aave. Здесь видна твоя позиция: сумма в Supply, текущий APY, накопленный доход. APY в Aave плавающий — меняется каждый день в зависимости от спроса заёмщиков. Сделай скриншот экрана с позицией — это твоя первая DeFi позиция, запомни момент. Запиши APY в заметки — он понадобится для сравнения с Morpho. Нормальный APY для USDC на Base: 6–15% годовых. Если видишь ниже 5% — рынок спокойный, выше 20% — повышенный спрос на займы." },
      { text: "Разобраться что такое Health Factor", description: "Health Factor (HF) — показатель здоровья позиции, актуален когда берёшь займ под залог. Формула простая: HF = (стоимость залога × LTV) / сумма займа. Если HF опускается ниже 1.0 — протокол автоматически продаёт часть твоего залога чтобы погасить долг, это называется ликвидация. Пример: ты положил $1000 ETH как залог и занял $600 USDC. ETH упал на 40%, теперь залог стоит $600 — HF приближается к 1.0, опасность ликвидации. Пока ты только делаешь Supply без займа — HF показывает бесконечность, всё безопасно. Для наглядности: на странице Aave нажми на любой актив → посмотри колонку Liquidation Threshold." },
      { text: "Зайти на app.morpho.org и сравнить с Aave", description: "Morpho — следующее поколение lending протоколов. Принцип работы: Morpho стоит поверх Aave и Compound и напрямую матчит кредиторов с заёмщиками, убирая посредника. Результат — выше ставки для кредиторов и ниже для заёмщиков. Как зайти: открой app.morpho.org → Connect Wallet → в левом меню выбери Earn → переключись на сеть Base → найди USDC vaults. Посмотри на APY — обычно на 2–5% выше Aave. Также обрати внимание на раздел Curators — это команды которые управляют риском в vault. Morpho Flagship USDC — самый консервативный и крупный vault." },
      { text: "Сравнить APY Morpho vs Aave и решить куда вложить", description: "Открой оба сайта одновременно и запиши цифры: Aave Base USDC APY = X%, Morpho Base USDC APY = Y%. Для независимой проверки зайди на defillama.com/yields → поиск USDC → отфильтруй по Chain: Base. Здесь увидишь все протоколы сразу. Логика выбора: если разница меньше 2% — оставляй в Aave (он старше и проверен). Если Morpho даёт на 3–5% больше — стоит рассмотреть переезд части средств. Важно: в Morpho нет единого vault, есть несколько — выбирай с TVL выше $50M и известным curator (Re7, Gauntlet, Block Analitica)." },
    ],
  },
  {
    week: 3,
    title: "LP $400",
    tasks: [
      { text: "Посмотреть видео: Uniswap v3 concentrated liquidity", description: "Concentrated liquidity — ключевая инновация Uniswap v3. Суть: в v2 твои деньги работают по всему диапазону цен от 0 до бесконечности, из которого реально используется 1–5%. В v3 ты указываешь конкретный диапазон, например ETH $3000–$4000. Все твои деньги работают только в этом диапазоне → в 10–50x больше комиссий. Но если цена выходит за диапазон — позиция перестаёт зарабатывать. Ищи на YouTube: 'Uniswap v3 concentrated liquidity explained' — каналы Finematics или Whiteboard Crypto дают хорошие 10-минутные разборы с анимацией. Посмотри хотя бы один до открытия реальной позиции." },
      { text: "Зайти на aerodrome.finance и изучить пары", description: "Aerodrome — крупнейший DEX на Base, форк Velodrome с доработками. Открой aerodrome.finance → Connect Wallet (нужна сеть Base) → раздел Pools. Нажми на колонку TVL чтобы отсортировать по убыванию. Найди пару USDC/WETH и нажми на неё — откроется детальная страница. Обрати внимание: APY складывается из двух частей — Trading Fees (от объёма торгов, стабильно) и AERO Emissions (токен-награды, могут меняться при голосованиях). Посмотри объём за 24ч — чем выше объём, тем стабильнее часть дохода от комиссий. Запиши итоговый APY в заметки." },
      { text: "Посчитать IL при падении ETH на -30% с калькулятором", description: "Обязательная практика перед открытием LP. Открой dailydefi.org/tools/impermanent-loss-calculator. Найди текущую цену ETH на coinmarketcap.com. Введи в калькулятор: initial price = текущая цена, new price = текущая × 0.7 (минус 30%). Пропорция 50/50. Нажми Calculate. Увидишь: IL ≈ 1.8% при -30%. Это твой «налог за вход» в LP в случае падения ETH. Теперь проверь ещё раз: если APY Aerodrome 40% годовых, то за 2 недели ты зарабатываешь ≈1.5% — то есть IL при -30% отбивается примерно за 2 недели работы позиции. Понимание этой математики — ключ к комфортным LP позициям." },
      { text: "Подготовить $200 USDC + $200 ETH на Base", description: "LP в паре USDC/WETH требует оба токена поровну. Если все $400 в USDC — нужно своповать половину. Как сделать: зайди на aerodrome.finance → Swap → USDC → WETH → введи $200 → Swap → подтверди в кошельке. Комиссия свопа мизерная (~$0.01 на Base). Важный момент: своп и открытие LP делай подряд, не с разрывом в несколько часов — иначе цена ETH изменится и пропорции поедут. Проверь баланс: должно быть ≈200 USDC и ≈0.05–0.07 ETH (зависит от курса)." },
      { text: "Открыть LP позицию USDC/WETH на Aerodrome", description: "Aerodrome → Pools → найди USDC/WETH (Concentrated) → нажми Add Liquidity. Для первого раза выбери режим Basic (он выберет диапазон автоматически — ±50% от текущей цены). Если хочешь разобраться с CL вручную — вводи диапазон: нижняя цена = текущая × 0.7, верхняя = текущая × 1.5. Введи суммы → нажми Approve USDC → подтверди → нажми Approve WETH → подтверди → Add Liquidity → подтверди последнюю транзакцию. Итого 3–4 транзакции. После этого в разделе My Positions появится твоя позиция с деталями." },
      { text: "Записать: количество LP токенов, APY, диапазон цен", description: "Сразу после открытия позиции сохрани скриншот экрана My Positions на Aerodrome. Запиши в заметки: дата открытия, сумма входа ($400), текущий APY (например 38%), диапазон цен если Concentrated (например ETH $2800–$5200), ID позиции (виден в URL или на странице позиции). Эти данные нужны для двух вещей: 1) Отслеживать реальный P&L — раз в неделю сравнивай текущую стоимость позиции с $400. 2) Знать когда позиция вышла из диапазона — тогда она перестаёт зарабатывать и надо ребалансировать." },
    ],
  },
  {
    week: 4,
    title: "BTCfi $300",
    tasks: [
      { text: "Зайти на lombard.finance и прочитать как работает LBTC", description: "Lombard — протокол liquid staking для Bitcoin. Логика такая: обычный BTC просто лежит и «ничего не делает» кроме как растёт в цене. Lombard позволяет обернуть BTC в LBTC (Liquid BTC) в пропорции 1:1 — ты сохраняешь полную экспозицию на BTC, но LBTC теперь можно использовать в DeFi как коллатерал или в LP пулах. Зайди на lombard.finance → раздел Learn или Docs → прочитай раздел How it works (5–10 минут). Lombard поддерживается крупными фондами (Polychain, Franklin Templeton) и прошёл аудиты от Halborn и Certik. Проверь историю аудитов на lombard.finance/security." },
      { text: "Найти какие протоколы принимают LBTC как коллатерал", description: "На lombard.finance перейди в раздел Ecosystem или Integrations. Там список протоколов где работает LBTC. Основные на сегодня: Aave v3 (Ethereum) — Supply LBTC, Morpho (Ethereum) — используй LBTC как залог, Spark — аналогично. Также смотри на defillama.com/protocol/lombard — здесь видно TVL и распределение LBTC по протоколам. Запиши 2–3 протокола с самым высоким TVL для LBTC — это значит рынок им доверяет. Самая простая стратегия: положить LBTC в Aave как Supply без займа → получать lending APY пока BTC растёт." },
      { text: "Изучить риски: смарт-контракт, депег LBTC, ликвидация", description: "Три риска которые нужно понять до входа. 1) Смарт-контракт риск: если взломают Lombard — LBTC может обесцениться или стать нелеквидным. Снижение риска: проверяй наличие актуальных аудитов и bug bounty программы (lombard.finance/security). 2) Депег LBTC: в теории если рынок паникует — LBTC может торговаться с дисконтом к BTC. Проверяй текущий peg на Uniswap или Curve (цена LBTC/WBTC должна быть ≈1). 3) Риск ликвидации: возникает ТОЛЬКО если ты занимаешь под LBTC. Без займа — нет ликвидации. На первом этапе используй LBTC только как Supply без займов." },
      { text: "BTC → Lombard → получить LBTC", description: "Предварительно нужен BTC на поддерживаемой сети (Ethereum mainnet или сеть указанная на сайте). Если BTC на Bybit — выводи через сеть ERC-20 (это Ethereum). Шаги: открой lombard.finance → Connect Wallet → нажми Stake/Mint → выбери сеть → введи сумму BTC → нажми Mint LBTC → Approve в кошельке (первый раз) → подтверди транзакцию Mint. Процесс занимает 1–3 минуты. После этого в кошельке увидишь LBTC токены — их стоимость ≈ стоимости BTC. Кроме того начинают накапливаться Lombard Points и Babylon Points — это будущие токены протокола." },
      { text: "Положить LBTC в Morpho или Aave как Supply", description: "После получения LBTC переходи в lending. Вариант 1 (проще): app.aave.com → переключись на Ethereum mainnet → в списке активов найди LBTC → Supply → введи всё количество → Approve → Supply. Вариант 2 (выгоднее): app.morpho.org → Earn → на Ethereum → ищи vault с LBTC (curators: Gauntlet или Re7). APY на Morpho обычно чуть выше. После Supply: BTC продолжает расти в цене (ты держишь экспозицию) + капает lending APY (обычно 1–3%) + продолжают накапливаться Lombard Points. Это трёхслойный доход при минимальном дополнительном риске." },
    ],
  },
  {
    week: 5,
    title: "Золото $300",
    tasks: [
      { text: "Купить $300 PAXG на бирже или через Uniswap", description: "PAXG (Paxos Gold) — токен привязанный к физическому золоту 1:1. 1 PAXG = 1 тройская унция золота (~31.1 грамм). Золото хранится в хранилищах Brink's в Лондоне, аудируется ежемесячно. Paxos — регулируемая компания с лицензией в NY DFS, это добавляет доверия. Сейчас 1 унция ≈ $3200, за $300 получишь ~0.094 PAXG. Как купить: вариант 1 — на Bybit (Assets → Buy → PAXG) или Kraken. Вариант 2 — через Uniswap на Ethereum: app.uniswap.org → своп USDC → PAXG. После покупки PAXG у тебя есть токенизированное золото — оно растёт вместе с ценой золота и падает вместе с ней." },
      { text: "Положить PAXG в Aave как Supply", description: "Aave v3 на Ethereum mainnet принимает PAXG. Как сделать: убедись что PAXG в кошельке на Ethereum → открой app.aave.com → убедись что выбрана сеть Ethereum (не Base, не Arbitrum) → найди PAXG в списке активов → нажми Supply → введи количество PAXG (можно Max) → Approve → Supply. Текущий APY для PAXG в Aave небольшой — 1–3% годовых. Но основная ставка не на процент, а на рост цены золота. Если золото вырастет на 10% — твоя позиция вырастет на 10% плюс 1–3% от lending. Это хедж от инфляции и нестабильности доллара." },
      { text: "Проверить LTV под PAXG и возможность займа стейблов", description: "LTV (Loan-to-Value) — параметр который говорит сколько можно занять под залог. На Aave для PAXG: нажми на PAXG в списке → увидишь параметры. LTV ≈ 75% значит под $300 PAXG можно занять максимум $225 USDC. Liquidation threshold ≈ 80% — если стоимость залога упадёт и HF < 1.0, позиция ликвидируется. Сценарий риска: ты занял $225 USDC под PAXG → золото упало на 20% → PAXG теперь $240 → HF приближается к порогу → нужно докладывать залог или отдавать часть займа. На этой неделе НЕ бери займ — просто изучи механику и запиши параметры." },
      { text: "Изучить Ondo Finance и токен OUSG", description: "RWA (Real World Assets) — следующая большая волна в DeFi: токенизация реальных активов. Ondo Finance — лидер в токенизации US Treasuries. OUSG — токен привязанный к портфелю краткосрочных US Treasury Bills. Доходность: ~5% годовых (ставка ФРС). Почему интересно: это практически безрисковая долларовая доходность на блокчейне. Как изучить: зайди на ondo.finance → Products → OUSG. Обрати внимание: OUSG требует KYC и минимальную сумму $5000, так что это скорее для понимания направления. Доступная альтернатива без KYC: токен USDY от Ondo на публичных сетях, без минимума." },
    ],
  },
  {
    week: 6,
    title: "Новые протоколы",
    tasks: [
      { text: "Изучить механику Proof of Liquidity на Berachain", description: "Berachain — относительно новый L1 с уникальной консенсус механикой PoL (Proof of Liquidity). Стандартный PoS: валидаторы стейкают токен сети → получают награды → всё. В PoL: валидаторы обязаны направлять emissions (BGT токены) в протоколы экосистемы, которые предоставляют им ликвидность. Это создаёт флайвил: чем больше ликвидности в протоколе — тем больше BGT emissions — тем выше APY — тем больше ликвидности. Как изучить: зайди на docs.berachain.com → Proof of Liquidity section. Займёт 15–20 минут. Ключевой момент: в Berachain есть три токена — BERA (газ), BGT (governance, non-transferable), HONEY (стейблкоин). Понимание этой трёхтокенной механики даёт ориентир какие позиции зарабатывают BGT emissions." },
      { text: "Добавить Berachain в кошелёк и получить BERA для газа", description: "Berachain EVM-совместима — твой адрес кошелька (Rabby/MetaMask) тот же самый. Добавь сеть: зайди на chainlist.org → поиск 'Berachain' → Add to MetaMask/Rabby → подтверди. Нужен BERA для оплаты газа. Как получить: вариант 1 — купи BERA на бирже (Bybit, OKX) и выведи на свой адрес в сети Berachain. Вариант 2 — используй bridge: bridge.berachain.com — переводи ETH или USDC из Ethereum/Arbitrum. Для газа хватит $5–10 в BERA. После получения BERA проверь баланс на berascan.io (вставь адрес кошелька)." },
      { text: "Зайти на Kodiak или Dolomite и открыть позицию", description: "Kodiak (kodiak.finance) — основной DEX на Berachain, аналог Uniswap. Dolomite (dolomite.io) — lending протокол. Для старта проще Dolomite: Connect Wallet → выбери актив (USDC или HONEY) → Supply → подтверди транзакцию. Если хочешь больше доходности — иди на Kodiak: Pools → найди пару HONEY/USDC → Add Liquidity. Главная цель этой недели не максимизировать доход, а потрогать экосистему и начать накапливать BGT emissions. Проверь в интерфейсе Kodiak/Dolomite — видна ли строка BGT rewards в твоей позиции." },
      { text: "Перевести $150 на Sonic через официальный bridge", description: "Sonic (бывший Fantom Opera, ребрендинг 2024) — быстрый EVM L1 с активной airdrop программой. Официальный bridge: gateway.soniclabs.com. Как пользоваться: подключи кошелёк → выбери откуда переводить (Ethereum, Base или Arbitrum) → выбери токен (USDC или ETH) → введи сумму $150 → Approve → Bridge. Время перевода: 5–20 минут. После завершения проверь баланс: открой sonicscan.org → вставь адрес кошелька → вкладка Tokens. Комиссия bridge минимальная (~$1–2)." },
      { text: "Положить USDC в Rings или SwapX на Sonic", description: "Rings Protocol (rings.money) — стейблкоин протокол на Sonic где scUSD (обёрнутый USDC) зарабатывает высокий APY + Sonic Activity Points. Как войти: rings.money → Connect Wallet (нужна сеть Sonic) → Deposit USDC → введи сумму → Approve → Deposit. Ты получишь scUSD и начнёшь накапливать Points. SwapX (swapx.fi) — альтернатива с LP позициями. Sonic Points конвертируются в токены $S при TGE — это потенциальный airdrop. Смотри текущий APY прямо на сайте Rings — обычно 8–20% на стейблы плюс Points. Важно: фиксируй сколько Points ты накапливаешь в день — это индикатор размера потенциального airdrop." },
      { text: "Изучить Fluid Protocol — lending нового поколения", description: "Fluid (fluid.instadapp.io) — протокол от команды Instadapp (одних из самых опытных DeFi разработчиков). Уникальность: в Fluid позиция ликвидности в DEX одновременно служит коллатералом для займа. Это сильно повышает капитальную эффективность — твои деньги работают в двух местах одновременно. Как изучить: зайди на fluid.instadapp.io → посмотри разделы Lend и Vault. В Lend сравни ставки по USDC с Aave — Fluid часто даёт выше. Для знакомства не нужно сразу вкладывать — просто изучи интерфейс и запиши APY для USDC. Если цифра интереснее Aave на 2%+ — можно часть средств перенести из Aave на следующей ревизии." },
    ],
  },
  {
    week: 7,
    title: "Pendle $300",
    tasks: [
      { text: "Прочитать: что такое PT и YT токены в Pendle", description: "Pendle — это рынок доходности. Принцип: ты берёшь доходный актив (например sUSDe с APY 12%) и разделяешь его на два токена. PT (Principal Token) — гарантированно вернёт тебе $100 в дату экспирации независимо от рыночных ставок. YT (Yield Token) — получает весь yield актива до экспирации. Пример: положил 100 sUSDe на 6 месяцев в Pendle → получил PT-sUSDe (100 USDC через 6 мес) + YT-sUSDe (весь процент за 6 мес, ~6 USDC). Для чего это нужно: если думаешь что ставки упадут — фиксируй их сейчас через PT. Если думаешь что ставки вырастут — покупай YT и получишь больше. Читай: docs.pendle.finance раздел Core Concepts, займёт 20 минут." },
      { text: "Зайти на app.pendle.finance и найти пул с USDC или sUSDe", description: "Открой app.pendle.finance → Connect Wallet. В разделе Markets видишь все доступные пулы. Фильтруй: нажми на колонку Underlying APY чтобы отсортировать. Ищи пулы с: базовым активом USDC, USDe, sUSDe или USDT (понятные стейблы без дополнительных рисков), TVL выше $20M (ликвидность), время до экспирации 1–6 месяцев (не слишком долго для первого раза). Нажми на понравившийся пул — откроется детальная страница с двумя вкладками: PT (фиксированная доходность) и YT (спекулятивная). Для первого раза выбирай PT." },
      { text: "Понять разницу: PT vs YT и что ты реально покупаешь", description: "PT (Principal Token) = облигация с фиксированным доходом. Ты покупаешь PT-sUSDe за 95 USDC. Pendle гарантирует: в дату экспирации PT-sUSDe стоит 100 USDC. Это 5% фиксированного дохода за период — неважно что будет со ставками на рынке. YT (Yield Token) = доходность без основного тела. Ты купил YT-sUSDe за $5 и если sUSDe продолжает генерировать 12% APY — за 6 мес получишь 6% от основной суммы (например $120 с $2000 позиции). Если ставки упадут — YT заработает меньше. Логика выбора: нет мнения о ставках → бери PT, хочешь поспекулировать на росте ставок → бери YT, хочешь стать маркет-мейкером → добавляй ликвидность в пул." },
      { text: "Открыть $300 в PT-позицию с фиксированной доходностью", description: "Выбрал пул → нажми на вкладку PT → нажми Buy PT. Введи сумму в USDC (например 300). Pendle покажет: сколько PT получишь, APY (фиксированный процент до экспирации), дата экспирации. Если всё устраивает → Approve USDC → Buy. Ты получишь PT-токены в кошельке. Дальше их не нужно трогать — просто держи до даты экспирации. В день экспирации (или позже): зайди на app.pendle.finance → Portfolio → нажми Redeem → получишь базовый актив + фиксированный доход. Важно: можно продать PT досрочно через рынок если нужны деньги — Pendle поддерживает вторичный рынок." },
    ],
  },
  {
    week: 8,
    title: "Ревизия",
    tasks: [
      { text: "Собрать таблицу всех позиций с реальными цифрами", description: "Это самая важная задача ревизии. Создай таблицу — хоть в заметках телефона, хоть в Google Sheets. Колонки: Протокол | Сеть | Актив | Вложено $ | Текущая стоимость $ | APY % | Доход за период $ | Статус (активна/закрыта). Заполни по каждой позиции. Как смотреть текущую стоимость: зайди на каждый протокол (Aave Dashboard, Aerodrome My Positions, Pendle Portfolio, lombard.finance) — там всё видно. Итоговая строка: суммарно вложено, суммарно сейчас, суммарный доход в $. Это твой первый DeFi отчёт." },
      { text: "Посчитать реальный доход за 8 недель: $ и % годовых", description: "Берёшь итоговую строку таблицы: доход = текущая стоимость − вложено. Пересчёт в годовые: (доход / вложено) × (365 / 56 дней) × 100%. Например: вложил $1700, сейчас $1765, доход $65 за 8 недель → ($65 / $1700) × (365/56) × 100% ≈ 24.9% годовых. Теперь сравни честно: тот же капитал в стейблах на Bybit Savings давал бы ~6–8% годовых. DeFi дал 25%? Отлично, риск оправдан. Дал 10%? Спорно — с учётом газа и времени может быть не стоит. Запиши итоговую цифру — она станет бенчмарком для следующего квартала." },
      { text: "Оценить каждый протокол по ощущениям и удобству", description: "Добавь к таблице субъективную колонку: 👍 понравился / 😐 нейтрально / 👎 неудобно / раздражает. Это не только про доходность — про опыт. Вопросы для оценки: Было ли понятно что делать? Не было ли страха потерять деньги в процессе? Хотел бы масштабировать? Было ли интересно следить за позицией? DeFi это надолго — если протокол вызывает стресс или скуку, это сигнал не тянуть его в следующий квартал. Личное удобство важно не меньше APY." },
      { text: "Решить: что масштабировать, от чего отказаться", description: "Объединяешь финансовые данные и субъективные оценки → принимаешь решения. Шаблон анализа: если протокол дал хороший доход И понравился → увеличить долю в следующем квартале. Если дал доход но не понравился → оставить в текущем размере. Если не дал дохода или было некомфортно → закрыть и перевести деньги туда где лучше. Примеры возможных решений: Aave стабильно 10%+, без нервов → с $400 поднять до $600. Berachain сложно и непонятно → выйти. Pendle фиксированный доход — интересно → добавить ещё $200. Запиши итоговое распределение на следующий квартал." },
      { text: "Изучить Eigenlayer и тему restaking", description: "Restaking — следующий уровень после стейкинга. Принцип: ты уже стейкаешь ETH и получаешь stETH или eETH. Eigenlayer позволяет использовать эти токены для дополнительного обеспечения безопасности других протоколов (Actively Validated Services, AVS). За это — дополнительные вознаграждения. Как изучить: зайди на app.eigenlayer.xyz → посмотри раздел Operators и AVS. Для понимания механики читай: docs.eigenlayer.xyz раздел Overview. Важно: restaking добавляет слой смарт-контракт риска поверх обычного staking риска. Понимай что берёшь на себя дополнительный риск в обмен на дополнительный доход." },
      { text: "Изучить GMX или Hyperliquid — децентрализованные перпы", description: "Perpetual futures (перпы) — торговля с кредитным плечом без даты экспирации. GMX (gmx.io на Arbitrum) и Hyperliquid (hyperliquid.xyz) — два лидера. Интересны не только для торговли но и для стороны поставщика ликвидности. GMX: LP предоставляют ликвидность в GLP или GM пул → получают 70% от всех комиссий трейдеров (15–40% годовых). Hyperliquid: токен HYPE, HLP vault. Как изучить GMX: зайди на app.gmx.io → раздел Earn → посмотри APR для GM пулов. Риск для LP: при больших однонаправленных движениях рынка LP может потерять деньги (несут риск против трейдеров)." },
      { text: "Составить план на следующие 2 месяца", description: "Финальная задача блока — написать конкретный план действий. Структура: 1) Распределение капитала: куда и сколько (в $ по каждому протоколу). 2) Новые направления для изучения: например restaking, Solana DeFi (Kamino, Drift), Real World Assets (Ondo). 3) Метрики успеха: какой доход за квартал будет хорошим результатом. 4) Риск-менеджмент: максимум % портфеля в новых/рискованных протоколах. Пиши конкретно: не 'изучить больше DeFi', а 'перевести $300 в Eigenlayer restaking через eETH к 15 числу'. Конкретность = реальные действия." },
    ],
  },
];

export const BYBIT_STEPS = [
  { step: "1", text: "Открой bybit.com в браузере (не приложение)", note: "Прямая ссылка: bybit.com/app/user/api-management" },
  { step: "2", text: "Войди в аккаунт → иконка профиля → Account Settings → API Management" },
  { step: "3", text: "Нажми «Create New Key» → выбери «System-generated API Keys»" },
  { step: "4", text: "Заполни форму", note: "Usage: API Transaction · Название: Master Dashboard · Права: только Read · IP: оставь пустым" },
  { step: "5", text: "Подтверди через 2FA (Google Authenticator или SMS)" },
  { step: "6", text: "Скопируй API Key и Secret Key — показываются только один раз!", note: "⚠️ Secret нигде не сохраняй кроме прокси-сервера" },
];

export const TYPE_ICONS = { lending: "◈", lp: "⟳", btcfi: "₿", gold: "◉", new: "✦", airdrop: "⬡", debt: "↯", vault: "◎" };

// Protocol → domain for favicon lookup (used as the position card icon).
export const PROTOCOL_DOMAINS = {
  "aave":        "aave.com",
  "morpho":      "morpho.org",
  "aerodrome":   "aerodrome.finance",
  "hyperliquid": "hyperliquid.xyz",
  "lighter":     "lighter.xyz",
  "loopscale":   "loopscale.com",
  "kamino":      "kamino.finance",
};

// Favicon URL for a protocol name (falls back gracefully if domain unknown).
export const protocolIcon = (protocol) => {
  const key = (protocol || "").toLowerCase().split(" ")[0];
  const domain = PROTOCOL_DOMAINS[key];
  return domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null;
};

// Protocol → dashboard/portfolio page (opened in a new tab from the distribution chart).
export const PROTOCOL_URLS = {
  "aave":        "https://app.aave.com",
  "morpho":      "https://app.morpho.org",
  "aerodrome":   "https://aerodrome.finance/dashboard",
  "hyperliquid": "https://app.hyperliquid.xyz/portfolio",
  "lighter":     "https://app.lighter.xyz/portfolio",
  "loopscale":   "https://app.loopscale.com/portfolio",
  "kodiak":      "https://app.kodiak.finance/portfolio",
};
export const protocolUrl = (protocol) => PROTOCOL_URLS[(protocol || "").toLowerCase().split(" ")[0]] || null;

export const C = {
  bg: "#080810", surface: "#0E0E1A", card: "#12121F", border: "#1E1E30",
  text: "#E8E8F4", muted: "#8A8AA8", accent: "#6C63FF",
  // Семантические акценты — использовать вместо сырых hex
  gold: "#FFD700",   // Way / деньги / цель
  green: "#4ADE80",  // рост / успех / Networth
  cyan: "#00E5FF",   // крипто / DeFi
  violet: "#7C5CFC", // личное / AI / Wishlist
  red: "#FF6450",    // ошибки / падение
  orange: "#FF9800", // предупреждения / changelog
};

export const BYBIT_PROXY_URL = "https://bybit-proxy.dimitriyak.workers.dev";
export const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || "https://ai-proxy.dimitriyak.workers.dev";
export const NEWS_URL = "https://defi-news.dimitriyak.workers.dev";
export const DEFI_PORTFOLIO_URL = "https://defi-portfolio.dimitriyak.workers.dev";

export const X_ACCOUNTS = [
  { handle: "DefiIgnas",         name: "Ignas DeFi",        focus: "Разборы протоколов, yield стратегии" },
  { handle: "0xngmi",            name: "0xngmi",            focus: "Данные DeFiLlama, аналитика" },
  { handle: "CryptoHayes",       name: "Arthur Hayes",      focus: "Макро, BTC, крупные тренды" },
  { handle: "sassal0x",          name: "sassal",            focus: "DeFi аналитика, Ethereum" },
  { handle: "Route2FI",          name: "Route 2 FI",        focus: "Yield farming, практика" },
  { handle: "DeFi_Made_Here",    name: "DeFi Made Here",    focus: "Обучение, механики" },
  { handle: "SmallCapScientist", name: "SmallCapScientist", focus: "Альфа, возможности" },
];

export const AI_STATS_URL = "https://ai-stats.dimitriyak.workers.dev";

// Все платные ресурсы сетапа. Цены (usd/мес) — РЕДАКТИРУЕМЫЕ прямо на странице Setup
// и синхронизируются в облако (ключ resources_cost). Здесь — дефолты/ориентиры,
// потому что биллинг GCP/Cloudflare/Supabase недоступен программно (урезанные scopes).
// usd: фактическая ежемесячная стоимость; live: id живого источника данных (если есть).
export const RESOURCES_DEFAULT = {
  rub: 80,            // курс ₽/$ для прикидки итога в рублях (редактируется)
  items: [
    { id: "claude",     group: "Подписки",        name: "Claude Code",            plan: "Max (подписка)",          usd: 100, color: "#D97706", live: "claude",   note: "Основной агент. Токены покрыты подпиской — flat, не по токенам." },
    { id: "gce",        group: "Серверы",          name: "GCE VM claude-agent",    plan: "e2-small · europe-west3", usd: 13,  color: "#4ADE80", note: "Хост моста + Claude Code (24/7)." },
    { id: "cloudrun",   group: "Серверы",          name: "Cloud Run · tg-bot",     plan: "pay-per-use",             usd: 0,   color: "#34D399", note: "Платится по запросам, обычно ~$0." },
    { id: "vertex",     group: "AI / API",         name: "Vertex AI · Gemini",     plan: "pay-per-token",           usd: 0,   color: "#7C5CFC", note: "Видео / STT / зрение. Пока с бонуса gcloud." },
    { id: "deepseek",   group: "AI / API",         name: "DeepSeek API",           plan: "pay-as-you-go",           usd: 0,   color: "#25BCFE", live: "deepseek", note: "Запасная модель бота. Баланс — в живом статусе." },
    { id: "groq",       group: "AI / API",         name: "Groq · STT (запас)",     plan: "free tier",               usd: 0,   color: "#FF9800", note: "Резерв распознавания речи." },
    { id: "heygen",     group: "AI / API",         name: "HeyGen · видео",         plan: "—",                       usd: 0,   color: "#fc5cf0", note: "Генерация видео, обкатывается." },
    { id: "supabase",   group: "Инфраструктура",   name: "Supabase",               plan: "Free · 2 проекта",        usd: 0,   color: "#3ECF8E", note: "БД flow/бота + neuromates." },
    { id: "cloudflare", group: "Инфраструктура",   name: "Cloudflare Pages+Workers", plan: "Free",                  usd: 0,   color: "#F38020", note: "Хостинг дашборда и воркеров." },
  ],
};

export const pill = (color, text, small) => ({
  display: "inline-flex", alignItems: "center",
  padding: small ? "2px 8px" : "4px 12px", borderRadius: 100,
  background: color + "22", color, border: `1px solid ${color}44`,
  fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.05em",
});
