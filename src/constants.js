export const STORAGE_KEYS = {
  wishes: "wishlist_state",
  defi: "defi_positions_v2",
  hw: "defi_hw",
  way: "way-to-1m-v1",
};

export const WISH_CATEGORIES = [
  { id: "health", icon: "🏥", title: "Здоровье", color: "#fc5c7d", items: ["Жировик удалить","Зуб имплант","Режим сна — спать по 8 часов","Бросить курить","Укреплять мышцы для падела","Красивое тело без пивного живота"] },
  { id: "sklld", icon: "🏢", title: "Skllad", color: "#7c5cfc", items: ["Маркетолог","Выход из операционки склад","Мотивация директор","Sklld 3 млн+ прибыли, +10% ежемесячно"] },
  { id: "ft", icon: "⚡", title: "FT", color: "#fcb85c", items: ["Ликвидация ФТ — свобода"] },
  { id: "personal", icon: "🪞", title: "Личное", color: "#5cfcb8", items: ["Фотосессия для аватарки","Татуировка — рукав, грудь"] },
  { id: "family", icon: "🏠", title: "Семья", color: "#5cbffc", items: ["Дом для родителей в Питере","Квартира 100м² — 40 млн","Ребёнок","Путешествия 1 раз в квартал","2 авто в семье"] },
  { id: "hobbies", icon: "🎿", title: "Увлечения", color: "#fc5cf0", items: ["Падел — выиграть категорию Б","Ракетка, форма для падела","Сноуборд Сочи/Шерегеш","Экипа для сноуборда","Турнир покер","Комп для стримов","Наушники AirPods","Logitech G PRO X Wireless"] },
  { id: "bigthink", icon: "🚀", title: "Мышление по-крупному", color: "#fc8a5c", items: ["Идея со стартапами — телепорт в новый мир","Крипта: развиваться, зарабатывать, не складывать яйца в одну корзину"] },
];

export const DEFI_INITIAL = [
  { id: 1, protocol: "Aave", network: "Base", asset: "USDC", allocated: 400, current: 0, apy: 0, status: "pending", type: "lending", color: "#B6509E" },
  { id: 2, protocol: "Aerodrome", network: "Base", asset: "USDC/ETH LP", allocated: 400, current: 0, apy: 0, status: "pending", type: "lp", color: "#FF0420" },
  { id: 3, protocol: "Lombard", network: "Ethereum", asset: "LBTC", allocated: 300, current: 0, apy: 0, status: "pending", type: "btcfi", color: "#F7931A" },
  { id: 4, protocol: "Aave (PAXG)", network: "Ethereum", asset: "PAXG", allocated: 300, current: 0, apy: 0, status: "pending", type: "gold", color: "#D4AF37" },
  { id: 5, protocol: "Sonic / Berachain", network: "Multi", asset: "Various", allocated: 300, current: 0, apy: 0, status: "pending", type: "new", color: "#00E5FF" },
  { id: 6, protocol: "Airdrop Farming", network: "Multi", asset: "Points", allocated: 300, current: 0, apy: 0, status: "pending", type: "airdrop", color: "#76FF03" },
];

export const WAY_INITIAL = {
  milestones: [
    { id: "m1", amount: 10000, label: "10K $", reached: false },
    { id: "m2", amount: 50000, label: "50K $", reached: false },
    { id: "m3", amount: 100000, label: "100K $", reached: false },
    { id: "m4", amount: 250000, label: "250K $", reached: false },
    { id: "m5", amount: 500000, label: "500K $", reached: false },
    { id: "m6", amount: 1000000, label: "1M $", reached: false },
  ],
  currentAmount: 0,
  tasks: [
    { id: "w1", text: "Настроить интеграцию API между Claude и Google Таблицами", done: false, priority: "high", category: "Инфраструктура" },
  ],
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
      { text: "Установить Rabby Wallet или настроить MetaMask", description: "Rabby — браузерное расширение, альтернатива MetaMask. Главный плюс: перед подписью любой транзакции он показывает человекочитаемым языком что именно ты разрешаешь. Это защита от фишинга. Если уже есть MetaMask — окей, можно работать с ним. Установить: rabby.io" },
      { text: "Добавить сеть Base (chainid: 8453)", description: "Base — L2 сеть от Coinbase на базе Ethereum. Здесь живут Aave и Aerodrome из нашего плана. Комиссии ~$0.01 вместо $5–20 на mainnet. Добавляется в кошелёк через Chainlist.org — ищи 'Base' и жми 'Add to MetaMask/Rabby'." },
      { text: "Добавить сеть Arbitrum (chainid: 42161)", description: "Arbitrum — ещё один популярный L2 Ethereum. Большая DeFi экосистема: GMX, Camelot, Radiant. Пригодится для экспериментального блока. Добавляется через Chainlist.org → 'Arbitrum One'." },
      { text: "Добавить сеть Optimism (chainid: 10)", description: "Optimism — L2 сеть, родная для Velodrome и Synthetix. Также низкие комиссии. Добавляется через Chainlist.org → 'OP Mainnet'." },
      { text: "Включить 2FA на бирже", description: "Двухфакторная аутентификация — обязательный минимум безопасности. Используй Google Authenticator или Authy, не SMS (SMS можно перехватить через sim-swap атаку). Включается в настройках аккаунта биржи → Security → 2FA." },
      { text: "Записать seed-фразу на бумагу, убрать в безопасное место", description: "Seed-фраза (12 или 24 слова) — это полный контроль над кошельком. Кто знает seed — тот владеет всеми средствами. Правила: никогда не фотографировать, не хранить в облаке, не отправлять никому. Записать на бумагу, лучше два экземпляра в разных местах." },
      { text: "Открыть defillama.com и поставить в закладки", description: "DeFiLlama — главный агрегатор данных DeFi. Здесь можно смотреть TVL протоколов, сравнивать APY по всем сетям, следить за взломами и новыми проектами. Заходи каждый день хотя бы на 5 минут — это твоя 'газета' DeFi рынка." },
      { text: "Найти раздел Yields, отфильтровать USDC и записать APY на Aave Base", description: "В DeFiLlama → Yields → фильтр по символу 'USDC' → найди строку Aave v3 на Base. Запиши текущий APY — это базовая ставка для стейблов. Так ты будешь понимать с чем сравнивать другие протоколы. Хорошая ставка сейчас: 8–15% годовых." },
      { text: "Найти раздел Hacks на DeFiLlama", description: "DeFiLlama → Hacks — здесь все зафиксированные взломы DeFi протоколов с суммами. Перед входом в любой протокол проверяй здесь. Если протокол взломали давно и он продолжает работать — это нормально, команда исправила баг. Свежий взлом — обходи стороной." },
      { text: "Подписаться в X на @DefiIgnas и @0xngmi", description: "@DefiIgnas — один из лучших DeFi аналитиков, пишет разборы протоколов и стратегий. @0xngmi — создатель DeFiLlama, технические инсайты и данные. Это минимальный сет для понимания что происходит на рынке." },
      { text: "Прочитать про Impermanent Loss", description: "Impermanent Loss (непостоянные потери) — ключевой риск LP позиций. Суть: ты вложил ETH+USDC в пул, ETH вырос x2, при выходе у тебя окажется меньше ETH чем если бы просто держал. Пул автоматически 'продавал' ETH пока он рос. Хорошая статья: finematics.com/impermanent-loss-explained" },
      { text: "Ответить себе: что происходит с LP позицией если ETH упадёт на 50%?", description: "Практическое упражнение на понимание IL. Используй калькулятор: dailydefi.org/tools/impermanent-loss-calculator. Введи: текущая цена ETH, новая цена -50%, пропорция 50/50. Посмотри на процент потерь vs просто держать. Это не страшно — просто нужно понимать механику." },
    ],
  },
  {
    week: 2,
    title: "Lending $400",
    tasks: [
      { text: "Перевести $400 USDC на сеть Base", description: "Выведи USDC с биржи напрямую в сеть Base (не Ethereum mainnet — там комиссии дорогие). На Bybit: Withdraw → USDC → выбрать сеть Base → вставить адрес кошелька. Минимальная сумма вывода обычно $10–20. Проверь что сеть указана Base, а не ERC-20." },
      { text: "Зайти на app.aave.com → выбрать Base → Supply USDC", description: "Aave — крупнейший lending протокол в DeFi, работает с 2020 года, аудирован многократно. Supply = ты даёшь деньги в долг другим пользователям и получаешь проценты. Процесс: подключи кошелёк → выбери сеть Base → нажми Supply на USDC → одобри транзакцию. Комиссия ~$0.01." },
      { text: "Сделать скриншот позиции и записать APY", description: "После Supply ты увидишь свою позицию в разделе Dashboard. Сделай скриншот с суммой и APY — это твоя первая реальная DeFi позиция. APY в Aave динамический — меняется в зависимости от спроса на заём. Норма для USDC: 6–15% годовых." },
      { text: "Разобраться что такое Health Factor и зачем он нужен", description: "Health Factor показывает насколько далеко ты от ликвидации — актуально если ты берёшь займы под залог. Если HF падает ниже 1.0 — позиция ликвидируется. Пока ты только кладёшь USDC (Supply) без займа — HF не применяется. Но понять концепцию важно для следующих шагов с коллатералом." },
      { text: "Зайти на morpho.org и изучить интерфейс", description: "Morpho — более новый lending протокол, часто даёт APY выше чем Aave за счёт более эффективного матчинга кредиторов и заёмщиков. Зайди на app.morpho.org, подключи кошелёк, посмотри раздел Earn → USDC vaults на Base. Пока деньги не перекладывай — просто изучи интерфейс." },
      { text: "Сравнить APY Morpho vs Aave, записать разницу", description: "Открой оба сайта и запиши текущие ставки для USDC на Base. Часто Morpho даёт +2–5% сверху Aave. Это важный навык — всегда сравнивать перед входом. Также проверь DeFiLlama → Yields для независимого подтверждения цифр." },
    ],
  },
  {
    week: 3,
    title: "LP $400",
    tasks: [
      { text: "Посмотреть видео: Uniswap v3 concentrated liquidity", description: "Concentrated liquidity — ключевая инновация Uniswap v3. В отличие от v2 где ликвидность размазана по всему диапазону цен, в v3 ты выбираешь конкретный диапазон. Это увеличивает доходность но добавляет риск IL и необходимость управления. Ищи на YouTube: 'Uniswap v3 concentrated liquidity explained' — есть хорошие 10-минутные разборы." },
      { text: "Зайти на aerodrome.finance и изучить пары", description: "Aerodrome — крупнейший DEX на Base, форк Velodrome. Зайди в раздел Pools, отсортируй по TVL. Найди пару USDC/WETH — посмотри TVL, объём за 24ч, текущий APY. Aerodrome платит emissions в токене AERO сверх комиссий — это и даёт высокий APY." },
      { text: "Посчитать IL при падении ETH на -30% с калькулятором", description: "Практика: зайди на dailydefi.org/tools/impermanent-loss-calculator. Введи текущую цену ETH и цену после -30%. При пропорции 50/50 IL составит примерно 2–3% от суммы позиции. Это меньше чем кажется — при APY 30–60% IL окупается за несколько недель." },
      { text: "Подготовить $200 USDC + $200 ETH на Base", description: "LP в паре USDC/ETH требует оба токена в равных долях по стоимости. Если у тебя $400 USDC — своп половину в ETH прямо на Base через Aerodrome или Uniswap. Комиссия свопа ~0.05%. Делай своп в момент когда готов сразу открывать позицию — иначе цена изменится." },
      { text: "Открыть LP позицию USDC/WETH на Aerodrome", description: "Aerodrome → Pools → найди USDC/WETH → Add Liquidity. Выбери тип позиции: CL (Concentrated Liquidity) для максимального APY или Basic для простоты. Для первого раза возьми Basic — нет необходимости выбирать диапазон. Апрув двух токенов + одна транзакция добавления." },
      { text: "Записать: количество LP токенов, APY, диапазон цен", description: "После открытия позиции сохрани скриншот с деталями. Запиши: сколько LP токенов получил, текущий APY (fees + emissions), если CL — запиши диапазон цен. Это нужно для отслеживания P&L и понимания когда позиция выходит из диапазона." },
    ],
  },
  {
    week: 4,
    title: "BTCfi $300",
    tasks: [
      { text: "Зайти на lombard.finance и прочитать как работает LBTC", description: "Lombard — протокол liquid staking для Bitcoin. Ты отправляешь BTC → получаешь LBTC (Liquid BTC) в соотношении 1:1. LBTC можно использовать в DeFi как коллатерал — BTC начинает работать вместо того чтобы просто лежать. Lombard имеет поддержку от крупных фондов и аудиты от нескольких компаний." },
      { text: "Найти какие протоколы принимают LBTC как коллатерал", description: "На lombard.finance в разделе Ecosystem или Integrations есть список. Основные: Aave v3 (Ethereum mainnet), Morpho, Spark. Там LBTC используется как залог — кладёшь LBTC, занимаешь USDC, эти USDC снова пускаешь в работу. Это называется leveraged yield strategy." },
      { text: "Изучить риски: смарт-контракт, депег LBTC, ликвидация", description: "Три главных риска BTCfi: 1) Смарт-контракт риск Lombard — если взломают, LBTC может обесцениться. 2) Депег — в теории LBTC может торговаться дешевле BTC при панике. 3) Ликвидация — если берёшь займ под LBTC и BTC падает, позиция может быть ликвидирована. Начинай без займов." },
      { text: "BTC → Lombard → получить LBTC", description: "На lombard.finance подключи кошелёк, выбери Mint LBTC. Понадобится BTC на Ethereum или поддерживаемой сети. Если BTC на бирже — сначала выведи на кошелёк в нужную сеть. Минимальная сумма обычно 0.001 BTC. После минта ты держишь LBTC — BTC продолжает расти в цене, а ты ещё получаешь Lombard points." },
      { text: "Положить LBTC в Morpho или Aave как Supply", description: "После получения LBTC зайди в Aave v3 на Ethereum mainnet или Morpho → Supply LBTC. Ты получишь APY от lending протокола + Lombard points продолжают капать. Это самая консервативная BTCfi стратегия — никакого займа, просто BTC работает и генерирует доход." },
    ],
  },
  {
    week: 5,
    title: "Золото $300",
    tasks: [
      { text: "Купить $300 PAXG на бирже или через Uniswap", description: "PAXG (Paxos Gold) — токен привязанный к физическому золоту, 1 PAXG = 1 тройская унция золота. Paxos — регулируемая компания в США, золото хранится в хранилищах LBMA. Купить можно на Kraken, Coinbase или напрямую через Uniswap. Сейчас 1 унция ≈ $3200, $300 даст тебе ~0.09 PAXG." },
      { text: "Положить PAXG в Aave как Supply", description: "Aave v3 на Ethereum mainnet принимает PAXG как Supply актив. Зайди на app.aave.com → Ethereum → Supply PAXG. APY небольшой (1–3%) но ты держишь экспозицию на золото — если золото растёт, растёт стоимость твоей позиции. Плюс маленький процент сверху." },
      { text: "Проверить: можно ли занять стейблы под PAXG и какой LTV", description: "LTV (Loan-to-Value) — сколько можно занять от стоимости залога. На Aave для PAXG обычно LTV около 75% — то есть под $300 PAXG можно занять ~$225 USDC. Это называется collateralized borrowing. Не делай этого сразу — сначала просто изучи параметры. Риск: если золото упадёт, займ может быть ликвидирован." },
      { text: "Изучить Ondo Finance — что такое RWA и OUSG", description: "RWA (Real World Assets) — токенизированные реальные активы. Ondo Finance токенизирует американские казначейские облигации. OUSG — токен привязанный к US Treasury Bills (~5% годовых, практически без риска). Это интересная альтернатива стейблам — держишь 'долларовый' актив с доходностью государственных облигаций США." },
    ],
  },
  {
    week: 6,
    title: "Новые протоколы",
    tasks: [
      { text: "Изучить механику Proof of Liquidity на Berachain", description: "Berachain — новый L1 с уникальной консенсус механикой PoL (Proof of Liquidity). В отличие от PoS где валидаторы стейкают токен сети, в PoL валидаторы должны предоставлять ликвидность в протоколы экосистемы. Это создаёт встроенный спрос на ликвидность. Читай: docs.berachain.com" },
      { text: "Завести кошелёк на Berachain и получить BERA", description: "Berachain совместима с EVM — твой существующий кошелёк (Rabby/MetaMask) работает. Добавь сеть: chainid 80094, RPC berachain.com. Нужен BERA для оплаты газа. Можно купить на Uniswap или через официальный bridge если уже есть активы в другой сети." },
      { text: "Зайти в один протокол экосистемы Berachain (Kodiak / Dolomite)", description: "Kodiak — основной DEX на Berachain. Dolomite — lending протокол. Зайди, подключи кошелёк, посмотри интерфейс. Если есть небольшая сумма — можно положить в lending на Dolomite. Цель этой недели — понять как работает новая экосистема, а не максимизировать доход." },
      { text: "Перевести $150 на Sonic Chain через официальный bridge", description: "Sonic (ex-Fantom) — быстрый EVM L1 с большой airdrop программой. Официальный bridge: gateway.soniclabs.com. Переводи USDC или ETH из Ethereum или другой сети. Время перевода: 5–30 минут. После получения средств проверь баланс на sonic.ftmscan.com." },
      { text: "Зайти в Rings или SwapX на Sonic — положить стейблы", description: "Rings Protocol — стейблкоин протокол на Sonic с высокими APY и Sonic points. SwapX — DEX на Sonic. Зайди на rings.money или swapx.fi, положи USDC в lending или LP. Главная цель — начать накапливать Sonic points которые конвертируются в $S токены при TGE." },
      { text: "Изучить Fluid Protocol на fluid.instadapp.io", description: "Fluid — новое поколение lending/DEX протокола от команды Instadapp. Уникальность: позиция ликвидности в DEX используется одновременно как коллатерал для займа. Это сильно повышает капитальную эффективность. Зайди на fluid.instadapp.io, сравни ставки по USDC с Aave." },
    ],
  },
  {
    week: 7,
    title: "Pendle $300",
    tasks: [
      { text: "Прочитать: что такое PT и YT токены в Pendle", description: "Pendle разделяет доходный актив на два токена: PT (Principal Token) — возвращает основную сумму в дату экспирации, YT (Yield Token) — получает весь yield до экспирации. Пример: положил 100 USDC с APY 12% на 6 месяцев → получил PT-USDC (вернёт 100 USDC через 6 мес) + YT-USDC (весь процент за 6 мес). Читай: docs.pendle.finance" },
      { text: "Зайти на pendle.finance и найти пул с USDC или sUSDe", description: "На app.pendle.finance → Markets. Ищи пулы с USDC, USDe или sUSDe — это самые понятные для старта. Смотри на: APY для PT (фиксированная доходность), время до экспирации, TVL пула. Хорошие пулы имеют TVL $10M+ и APY 10–15% фиксированных." },
      { text: "Понять что ты покупаешь когда берёшь PT-позицию", description: "PT = фиксированная доходность. Ты покупаешь PT-USDC со скидкой (например за 95 USDC получаешь PT который в дату экспирации стоит 100 USDC). Это 5% фиксированного дохода независимо от рыночных ставок. В отличие от Aave где APY меняется каждый день, здесь ты фиксируешь доходность в момент входа." },
      { text: "Открыть $300 в PT-позицию с фиксированной доходностью", description: "Выбери понравившийся пул с PT → нажми Buy PT → введи сумму → подтверди транзакцию. Ты получишь PT-токены. Их не нужно мониторить ежедневно — просто держи до экспирации. В дату экспирации обменяй PT обратно на базовый актив + получишь фиксированный доход." },
    ],
  },
  {
    week: 8,
    title: "Ревизия",
    tasks: [
      { text: "Собрать таблицу: платформа / сумма вложена / текущая сумма / APY / реальный доход $", description: "Создай таблицу (хоть в заметках) по каждой позиции. Колонки: протокол, сеть, актив, сколько вложил, сколько сейчас, APY, доход за период в долларах. Это даст реальную картину — какие позиции работают лучше, где реальный доход, а где только бумажный APY." },
      { text: "Посчитать реальный доход за 8 недель в $ и % годовых", description: "Сложи доход по всем позициям. Пересчитай в годовые проценты: (доход / вложено) × (52 / недели). Сравни с 'если бы просто держал в стейблах на бирже'. Это честная оценка стоит ли DeFi твоего времени и риска." },
      { text: "Оценить каждый протокол: понравился / нейтрально / не понравился и почему", description: "Субъективная оценка важна — DeFi это хобби. Что было интересно? Что показалось скучным? Где интерфейс удобный, где нет? Это поможет определить куда масштабировать в следующем цикле и что бросить." },
      { text: "Решить что масштабировать, от чего отказаться", description: "На основе данных и оценок: куда добавить капитал, какие позиции закрыть. Например: Aave скучно но стабильно — оставить. Pendle интересно и доходно — увеличить долю. Berachain неудобно — убрать из плана. Это твоя персональная DeFi стратегия на следующий квартал." },
      { text: "Изучить Eigenlayer / restaking как следующую большую тему", description: "Restaking — использование уже застейканного ETH для обеспечения безопасности других протоколов. Eigenlayer — лидер этого направления. Позволяет получать дополнительный доход на ETH который уже стейкается. Читай: docs.eigenlayer.xyz. Это сложнее текущей программы но логичный следующий шаг." },
      { text: "Изучить GMX или Hyperliquid — перпетуальные фьючерсы в DeFi", description: "Перпы (perpetual futures) — торговля с плечом без даты экспирации. GMX на Arbitrum и Hyperliquid — два крупнейших decentralized perp DEX. Интересны не только для торговли но и для предоставления ликвидности (быть 'домом казино'). Доходность для LP: 15–40% годовых но с риском потерь при больших движениях рынка." },
      { text: "Составить план на следующие 2 месяца с новыми целями", description: "Что дальше? Возможные направления: увеличить капитал в лучших протоколах, добавить restaking через Eigenlayer, попробовать перпы на небольшую сумму, глубже уйти в airdrop farming, изучить Solana DeFi (Kamino, Drift). Запиши конкретные цели с суммами и протоколами." },
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

export const TYPE_ICONS = { lending: "◈", lp: "⟳", btcfi: "₿", gold: "◉", new: "✦", airdrop: "⬡" };

export const C = {
  bg: "#080810", surface: "#0E0E1A", card: "#12121F", border: "#1E1E30",
  text: "#E8E8F4", muted: "#5A5A7A", accent: "#6C63FF",
};

export const BYBIT_PROXY_URL = "https://bybit-proxy.dimitriyak.workers.dev";
export const AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || "https://ai-proxy.dimitriyak.workers.dev";

export const pill = (color, text, small) => ({
  display: "inline-flex", alignItems: "center",
  padding: small ? "2px 8px" : "4px 12px", borderRadius: 100,
  background: color + "22", color, border: `1px solid ${color}44`,
  fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.05em",
});
