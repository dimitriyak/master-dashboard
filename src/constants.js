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
  { week: 0, title: "Подготовка", tasks: ["Настроить интеграцию с Claude через API — обновление дашборда из чата"] },
  { week: 1, title: "Фундамент", tasks: ["Установить Rabby Wallet","Добавить сети Base/Arbitrum/Optimism","Включить 2FA везде","Seed-фразы на бумагу","Открыть DeFiLlama","Подписки в X: @DefiIgnas @0xngmi","Прочитать про impermanent loss"] },
  { week: 2, title: "Lending $400", tasks: ["Перевести $400 USDC на Base","Зайти в Aave → Supply USDC","Скриншот позиции и APY","Разобраться с Health Factor","Зайти на morpho.org","Сравнить APY Morpho vs Aave"] },
  { week: 3, title: "LP $400", tasks: ["YouTube: Uniswap v3 concentrated liquidity","Изучить пары на Aerodrome","Посчитать IL при -30% ETH","Подготовить $200 USDC + $200 ETH","Открыть позицию USDC/ETH","Записать LP токены и APY"] },
  { week: 4, title: "BTCfi $300", tasks: ["lombard.finance — изучить LBTC","Найти протоколы принимающие LBTC","Изучить риски","BTC → Lombard → LBTC","Положить LBTC в Morpho/Aave"] },
  { week: 5, title: "Золото $300", tasks: ["Купить $300 PAXG","Положить PAXG в Aave","Проверить LTV под PAXG","Изучить Ondo Finance / RWA"] },
  { week: 6, title: "Новые протоколы", tasks: ["Изучить Proof of Liquidity (Bera)","Завести кошелёк на Berachain","Зайти в Kodiak/Dolomite/Infrared","Перевести $150 на Sonic","Зайти в Rings или SwapX","Изучить Fluid Protocol"] },
  { week: 7, title: "Pendle $300", tasks: ["Прочитать про PT и YT токены","Найти пул на pendle.finance","Понять механику PT","Открыть $300 PT-позицию"] },
  { week: 8, title: "Ревизия", tasks: ["Собрать таблицу позиций","Посчитать доход за 8 недель","Оценить каждый протокол","Изучить Eigenlayer/restaking","Изучить GMX/Hyperliquid","Составить план на 2 месяца"] },
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
