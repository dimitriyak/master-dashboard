// Auto-reads all DeFi positions from public blockchain data — no paid API needed.
// Protocols: Aave V3 (Base + Ethereum), Morpho Blue (Base + Ethereum), Aerodrome (Base)
// Wallet: 0x2d80f9BEf9dA5bc0C011d7239d31997528216aeC

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WALLET = "0x2d80f9BEf9dA5bc0C011d7239d31997528216aeC";

// Multiple keyless endpoints per chain — rotated by rpcCall so one rate-limited (429) RPC
// doesn't blank out a position. publicnode alone gets rate-limited by Cloudflare's shared IPs.
const RPC = {
  base:     ["https://base-rpc.publicnode.com", "https://base-mainnet.public.blastapi.io", "https://base.drpc.org", "https://1rpc.io/base"],
  ethereum: ["https://ethereum-rpc.publicnode.com", "https://eth-mainnet.public.blastapi.io", "https://eth.drpc.org", "https://rpc.mevblocker.io", "https://1rpc.io/eth"],
  bera:     ["https://rpc.berachain.com", "https://berachain.drpc.org"],
  arbitrum: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc", "https://arbitrum.drpc.org", "https://1rpc.io/arb"],
};

// JSON-RPC call (single or batch) with endpoint rotation: tries each until a valid result comes back.
async function rpcCall(chain, body) {
  const urls = RPC[chain] || [];
  for (const url of urls) {
    const r = await tfetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, 6000)
      .then(r => r.json()).catch(() => null);
    const ok = Array.isArray(r) ? r.some(x => x?.result !== undefined) : (r && r.result !== undefined);
    if (ok) return r;
  }
  return Array.isArray(body) ? [] : null;
}

// ── Aave V3 aTokens ───────────────────────────────────────────────────────────
// balanceOf(wallet) → current balance including accrued interest
const AAVE_ATOKENS = [
  // Base
  { id: "aave-base-usdc",  chain: "base", protocol: "Aave V3", asset: "USDC",  address: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB", decimals: 6,  color: "#B6509E" },
  { id: "aave-base-weth",  chain: "base", protocol: "Aave V3", asset: "WETH",  address: "0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7", decimals: 18, color: "#B6509E" },
  { id: "aave-base-wsteth",chain: "base", protocol: "Aave V3", asset: "wstETH",address: "0x99CBC45ea5bb7eF3a5BC08FB1B7E56bB2442Ef0D", decimals: 18, color: "#B6509E" },
  { id: "aave-base-cbeth", chain: "base", protocol: "Aave V3", asset: "cbETH", address: "0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78C", decimals: 18, color: "#B6509E" },
  // Ethereum
  { id: "aave-eth-usdc",   chain: "ethereum", protocol: "Aave V3", asset: "USDC",  address: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c", decimals: 6,  color: "#B6509E" },
  { id: "aave-eth-usdt",   chain: "ethereum", protocol: "Aave V3", asset: "USDT",  address: "0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a", decimals: 6,  color: "#B6509E" },
  { id: "aave-eth-weth",   chain: "ethereum", protocol: "Aave V3", asset: "WETH",  address: "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8", decimals: 18, color: "#B6509E" },
  { id: "aave-eth-wbtc",   chain: "ethereum", protocol: "Aave V3", asset: "WBTC",  address: "0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8", decimals: 8,  color: "#B6509E" },
  { id: "aave-eth-paxg",   chain: "ethereum", protocol: "Aave V3", asset: "PAXG",  address: "0xc7B4c17861357B8ABB91F25581E7263E08DCB59c", decimals: 18, color: "#D4AF37" },
  { id: "aave-eth-wsteth", chain: "ethereum", protocol: "Aave V3", asset: "wstETH",address: "0x0B925eD163218f6662a35e0f0371Ac234f9E9371", decimals: 18, color: "#B6509E" },
];

// ── Morpho MetaMorpho vault tokens (ERC4626) ──────────────────────────────────
// Addresses verified via symbol() on-chain + Morpho Blue API
const MORPHO_VAULTS = [
  // Base — verified on-chain
  // Morpho V2 vaults (newer protocol, separate from MetaMorpho/Morpho Blue)
  { id: "morpho-base-usdc-steak-v2",  chain: "base", protocol: "Morpho", asset: "USDC", address: "0xbeef0e0834849aCC03f0089F01f4F1Eeb06873C9", decimals: 6,  color: "#7C5CFC", name: "Steakhouse Prime USDC V2" },
  // Morpho V1 (MetaMorpho) vaults
  { id: "morpho-base-usdc-steak",     chain: "base", protocol: "Morpho", asset: "USDC", address: "0xBEEf010f9cb27031Ad51e3333f9af9C6B1228183", decimals: 6,  color: "#7C5CFC", name: "Steakhouse USDC" },
  { id: "morpho-base-usdc-moonwell",  chain: "base", protocol: "Morpho", asset: "USDC", address: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca", decimals: 6,  color: "#7C5CFC", name: "Moonwell USDC" },
  { id: "morpho-base-usdc-gauntlet",  chain: "base", protocol: "Morpho", asset: "USDC", address: "0x6B13c060F13Af1fdB319E52315BeBd8b487E1eb1", decimals: 6,  color: "#7C5CFC", name: "Gauntlet USDC Core" },
  { id: "morpho-base-weth-moonwell",  chain: "base", protocol: "Morpho", asset: "WETH", address: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1", decimals: 18, color: "#7C5CFC", name: "Moonwell WETH" },
  { id: "morpho-base-usdc-re7",       chain: "base", protocol: "Morpho", asset: "USDC", address: "0x35C3f04C2F5c67Fc3f1Dbf92d51d67Ec94b8F3c5", decimals: 6,  color: "#7C5CFC", name: "Re7 USDC" },
  // Ethereum
  { id: "morpho-eth-usdc-steak",      chain: "ethereum", protocol: "Morpho", asset: "USDC", address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", decimals: 6,  color: "#7C5CFC", name: "Steakhouse USDC" },
  { id: "morpho-eth-usdc-gauntlet",   chain: "ethereum", protocol: "Morpho", asset: "USDC", address: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458", decimals: 6,  color: "#7C5CFC", name: "Gauntlet USDC Prime" },
  { id: "morpho-eth-wbtc-gauntlet",   chain: "ethereum", protocol: "Morpho", asset: "WBTC", address: "0x443df5eEE3196e9b2Dd77CaBd3eA76835def7B2", decimals: 8,  color: "#7C5CFC", name: "Gauntlet WBTC Prime" },
];

// ── Aerodrome LP tokens & Gauge stakes (Base) ─────────────────────────────────
// Each entry has lpToken (ERC20) + gauge (staking contract)
// We check both: unstaked LP + staked in gauge
// t0/t1: decimals and price source ("stable"==$1, "eth", "skip")
const AERO_POOLS = [
  { id: "aero-usdc-weth",  asset: "USDC/WETH",  lpToken: "0xcDAC0d6c6C59727a65F871236188350531885C43", gauge: "0x519BBD1Dd8C6A94C46080E24f316c14Ee758C025", decimals: 18, color: "#FF0420", t0: { dec: 18, price: "eth" },    t1: { dec: 6,  price: "stable" } },
  { id: "aero-usdc-usdbc", asset: "USDC/USDbC", lpToken: "0x27a8Afa3Bd49406e48a074350fB7b2020c43B2bD", gauge: "0x1cfc45C5221A07DA0DE958098A319a29FbBD66fE", decimals: 18, color: "#FF0420", t0: { dec: 6,  price: "stable" }, t1: { dec: 6,  price: "stable" } },
  { id: "aero-weth-cbeth", asset: "WETH/cbETH", lpToken: "0x44Ecc644449fC3a9858d2007CaA8CFAa4C561f91", gauge: "0xDf7c8F17Ab7D47702A4a4b6D951d2A4c90F99bf4", decimals: 18, color: "#FF0420", t0: { dec: 18, price: "eth" },    t1: { dec: 18, price: "eth" }    },
  { id: "aero-usdc-aero",  asset: "USDC/AERO",  lpToken: "0x6cDcb1C4A4D1C3C6d054b27AC5B77e89eAFb971d", gauge: "0x4F09bAb2f0E15e2A078A227FE1537665F55b8360", decimals: 18, color: "#FF0420", t0: { dec: 6,  price: "stable" }, t1: { dec: 18, price: "aero" }    },
  { id: "aero-usdc-eurc",  asset: "USDC/EURC",  lpToken: "0x4b6b9B31c72836806B0B1104Cf1CdAB8f0E641b8", gauge: "0x1Fd4a95f4335CF36cAc85912F5b8E7b1bB3c7Ae", decimals: 18, color: "#FF0420", t0: { dec: 6,  price: "stable" }, t1: { dec: 6,  price: "stable" } },
  // WETH/VVV vAMM (Basic Volatile). VVV без чистого фида — оцениваем пул как 2× сторону WETH (~50/50).
  { id: "aero-weth-vvv",   asset: "WETH/VVV",   lpToken: "0x01784ef301D79e4B2DF3a21ad9a536d4cF09A5Ce", gauge: "0x37a70295fcefebBB0a29735A53E2e6786a02F930", decimals: 18, color: "#FF0420", t0: { dec: 18, price: "eth" },    t1: { dec: 18, price: "skip" }   },
];

// Chainlink ETH/USD on Base — latestAnswer() returns price * 1e8
const CHAINLINK_ETH_USD = "0x71041dddad3595F9CEd3dCCFBe3D1F4b0a16Bb70";

const BAL_SEL = "0x70a08231";
const CONVERT_TO_ASSETS_SEL = "0x07a2d13a"; // convertToAssets(uint256)

// DeFiLlama pool IDs → position IDs
const LLAMA_POOLS = [
  { posId: "morpho-base-usdc-steak-v2", poolId: "7820bd3c-461a-4811-9f0b-1d39c1503c3f" },
  { posId: "aero-usdc-weth",            poolId: "e8cb4dbb-9e66-4cfa-9c77-407118b128a0" },
  { posId: "aero-usdc-aero",            poolId: "d32f9c01-47d1-4077-8c73-8b91b08d1e91" },
];

const MANUAL_POSITIONS = [
  {
    id: "loopscale-growth",
    chain: "solana",
    protocol: "Loopscale",
    asset: "OnRe Growth",
    balance: 99.78,
    usdValue: 99.78,
    type: "vault",
    color: "#14F195",
  },
  {
    id: "aero-msusd-usdc-cl",
    chain: "base",
    protocol: "Aerodrome",
    asset: "msUSD/USDC CL",
    balance: 400.49,
    usdValue: 400.49,
    apy: 7.55,
    type: "lp",
    color: "#FF0420",
    aeroEarned: 0.00087,
  },
  {
    id: "aero-weth-aero-cl",
    chain: "base",
    protocol: "Aerodrome",
    asset: "WETH/AERO CL",
    balance: 211.79,
    usdValue: 211.79,
    apy: 1146.97,
    type: "lp",
    color: "#FF0420",
    aeroEarned: 0.00238,
  },
];

async function fetchApys() {
  const results = await Promise.allSettled(
    LLAMA_POOLS.map(p =>
      tfetch(`https://yields.llama.fi/chart/${p.poolId}`)
        .then(r => r.json())
        .then(d => {
          const last = Array.isArray(d?.data) ? d.data[d.data.length - 1] : null;
          return [p.posId, last?.apy != null ? Math.round(last.apy * 100) / 100 : null];
        })
    )
  );
  const apys = {};
  results.forEach(r => { if (r.status === "fulfilled" && r.value[1] != null) apys[r.value[0]] = r.value[1]; });
  return apys;
}

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    try {
      // Each source is wrapped so one slow/hanging upstream can't stall the whole response.
      const guard = (p, fallback) => Promise.race([
        Promise.resolve().then(() => p).catch(() => fallback),
        new Promise(res => setTimeout(() => res(fallback), 16000)),
      ]);
      const [aave, morpho, aerodrome, walletTokens, nativeBalances, aaveEthereum, hyperliquid, lighter, loopscale, kodiak, apys, prices] = await Promise.all([
        guard(fetchAave(), []),
        guard(fetchMorpho(), []),
        guard(fetchAerodrome(), []),
        guard(fetchWalletTokens(), []),
        guard(fetchNativeBalances(), []),
        guard(fetchAaveEthereum(), []),
        guard(fetchHyperliquid(), []),
        guard(fetchLighter(), []),
        guard(fetchLoopscale(), []),
        [],
        guard(fetchApys(), {}),
        guard(fetchAllPrices(), {}),
      ]);

      // LP positions: any non-zero balance counts (LP token amounts are tiny by design)
      const allPositions = [...aave, ...morpho].filter(p => p.balance >= 0.01)
        .concat(aerodrome.filter(p => p.staked > 0 || p.unstaked > 0))
        .concat(aaveEthereum)
        .concat(hyperliquid)
        .concat(lighter)
        .concat(loopscale)
        .concat(kodiak)
        .concat(MANUAL_POSITIONS);

      // Attach APY from DeFiLlama where available
      const positions = allPositions.map(p => apys[p.id] != null ? { ...p, apy: apys[p.id] } : p);

      return json({
        wallet: WALLET,
        positions,
        prices,
        walletTokens: [...walletTokens, ...nativeBalances].filter(p => p.balance >= 0.0001),
        updated: new Date().toISOString(),
      });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};

// ── Aave: batch balanceOf per chain ───────────────────────────────────────────
async function fetchAave() {
  const byChain = groupBy(AAVE_ATOKENS, t => t.chain);
  const results = await Promise.allSettled(
    Object.entries(byChain).map(([chain, tokens]) => batchBalanceOf(chain, tokens))
  );
  return results.flatMap(r => r.status === "fulfilled" ? r.value : [])
    .map(t => ({ ...t, type: "lending", protocol: "Aave V3" }));
}

// ── Morpho: batch check shares + convert to assets ────────────────────────────
async function fetchMorpho() {
  const byChain = groupBy(MORPHO_VAULTS, v => v.chain);
  const results = await Promise.allSettled(
    Object.entries(byChain).map(([chain, vaults]) => batchMorphoVaults(chain, vaults))
  );
  return results.flatMap(r => r.status === "fulfilled" ? r.value : [])
    .map(t => ({ ...t, type: "lending", protocol: "Morpho" }));
}

// ── Aerodrome: check LP tokens + gauge stakes + USD valuation ─────────────────
async function fetchAerodrome() {
  const walletHex = WALLET.toLowerCase().replace("0x", "").padStart(64, "0");
  const RESERVES_SEL    = "0x0902f1ac"; // getReserves()
  const TOTAL_SUPPLY_SEL = "0x18160ddd"; // totalSupply()
  const LATEST_ANS_SEL   = "0x50d25bcd"; // latestAnswer() Chainlink

  // Step 1: check LP + gauge balances for all pools in one batch
  const batch = [];
  AERO_POOLS.forEach((pool, i) => {
    batch.push({ jsonrpc: "2.0", id: i * 2,     method: "eth_call", params: [{ to: pool.lpToken, data: BAL_SEL + walletHex }, "latest"] });
    batch.push({ jsonrpc: "2.0", id: i * 2 + 1, method: "eth_call", params: [{ to: pool.gauge,   data: BAL_SEL + walletHex }, "latest"] });
  });

  const res1 = await rpcCall("base", batch);
  if (!Array.isArray(res1)) return [];

  // Find active pools (non-zero)
  const active = AERO_POOLS.filter((pool, i) => {
    const rawLp    = res1.find(r => r.id === i * 2)?.result;
    const rawGauge = res1.find(r => r.id === i * 2 + 1)?.result;
    return (rawLp && rawLp !== "0x" && BigInt(rawLp) > 0n) || (rawGauge && rawGauge !== "0x" && BigInt(rawGauge) > 0n);
  });

  if (active.length === 0) return [];

  const EARNED_SEL = "0x008cc262"; // earned(address) → claimable AERO
  // AERO/USDC vAMM pool on Base — use reserves to derive AERO price
  const AERO_USDC_POOL = "0x6cDcb1C4A4D1C3C6d054b27AC5B77e89eAFb971d";

  // Step 2: reserves + totalSupply + ETH price + AERO earned + AERO price in one batch
  const batch2 = [
    { jsonrpc: "2.0", id: 9999, method: "eth_call", params: [{ to: CHAINLINK_ETH_USD, data: LATEST_ANS_SEL }, "latest"] },
    { jsonrpc: "2.0", id: 9998, method: "eth_call", params: [{ to: AERO_USDC_POOL,    data: RESERVES_SEL   }, "latest"] }, // AERO/USDC reserves
  ];
  active.forEach((pool, i) => {
    batch2.push({ jsonrpc: "2.0", id: 1000 + i * 3,     method: "eth_call", params: [{ to: pool.lpToken, data: RESERVES_SEL    }, "latest"] });
    batch2.push({ jsonrpc: "2.0", id: 1000 + i * 3 + 1, method: "eth_call", params: [{ to: pool.lpToken, data: TOTAL_SUPPLY_SEL }, "latest"] });
    batch2.push({ jsonrpc: "2.0", id: 1000 + i * 3 + 2, method: "eth_call", params: [{ to: pool.gauge,   data: EARNED_SEL + walletHex }, "latest"] });
  });

  const res2 = await rpcCall("base", batch2);

  const ethPriceRaw   = Array.isArray(res2) ? res2.find(r => r.id === 9999)?.result : null;
  const aeroReservHex = Array.isArray(res2) ? res2.find(r => r.id === 9998)?.result : null;
  const ethPrice = (await fetchEthPrice()) ?? (ethPriceRaw && ethPriceRaw !== "0x" ? Number(BigInt(ethPriceRaw)) / 1e8 : 2500);
  // AERO/USDC pool sorted by address: token0=USDC (6dec, 0x833...), token1=AERO (18dec, 0x940...)
  let aeroPrice = 0;
  if (aeroReservHex && aeroReservHex !== "0x") {
    const hex = aeroReservHex.replace("0x", "");
    const r0 = Number(BigInt("0x" + hex.slice(0, 64)));   // USDC (6 dec)
    const r1 = Number(BigInt("0x" + hex.slice(64, 128)));  // AERO (18 dec)
    if (r1 > 0) aeroPrice = (r0 / 1e6) / (r1 / 1e18);
  }

  return active.map((pool, ai) => {
    const poolIdx = AERO_POOLS.indexOf(pool);
    const rawLp    = res1.find(r => r.id === poolIdx * 2)?.result;
    const rawGauge = res1.find(r => r.id === poolIdx * 2 + 1)?.result;
    const rawLpBig    = rawLp    && rawLp    !== "0x" ? BigInt(rawLp)    : 0n;
    const rawGaugeBig = rawGauge && rawGauge !== "0x" ? BigInt(rawGauge) : 0n;
    const unstaked = Number(rawLpBig)    / 1e18;
    const staked   = Number(rawGaugeBig) / 1e18;
    const totalLp  = unstaked + staked;

    // USD value from reserves
    let usdValue = null;
    if (Array.isArray(res2)) {
      const reservesHex    = res2.find(r => r.id === 1000 + ai * 3)?.result;
      const totalSupplyHex = res2.find(r => r.id === 1000 + ai * 3 + 1)?.result;
      if (reservesHex && reservesHex !== "0x" && totalSupplyHex && totalSupplyHex !== "0x") {
        const hex = reservesHex.replace("0x", "");
        const reserve0    = BigInt("0x" + hex.slice(0, 64));
        const reserve1    = BigInt("0x" + hex.slice(64, 128));
        const totalSupply = BigInt(totalSupplyHex);
        if (totalSupply > 0n) {
          const tokenPrice = (t, rawAmt) => {
            const amt = Number(rawAmt) / (10 ** t.dec);
            return t.price === "stable" ? amt : t.price === "eth" ? amt * ethPrice : t.price === "aero" ? amt * aeroPrice : 0;
          };
          const v0 = tokenPrice(pool.t0, reserve0);
          const v1 = tokenPrice(pool.t1, reserve1);
          // Если одна сторона без цены ("skip") — волатильный пул ~50/50, оцениваем как 2× известную сторону.
          const poolUsd = (v0 && v1) ? v0 + v1 : 2 * (v0 || v1);
          usdValue = (totalLp / (Number(totalSupply) / 1e18)) * poolUsd;
        }
      }
    }

    // Claimable AERO emissions
    let aeroEarned = null, aeroEarnedUsd = null;
    if (Array.isArray(res2)) {
      const earnedHex = res2.find(r => r.id === 1000 + ai * 3 + 2)?.result;
      if (earnedHex && earnedHex !== "0x") {
        aeroEarned = Math.round(Number(BigInt(earnedHex)) / 1e18 * 10000) / 10000;
        if (aeroPrice > 0) aeroEarnedUsd = Math.round(aeroEarned * aeroPrice * 100) / 100;
      }
    }

    return { id: pool.id, protocol: "Aerodrome", chain: "Base", asset: pool.asset,
             balance: totalLp, staked, unstaked, color: pool.color, type: "lp",
             usdValue:       usdValue   != null ? Math.round(usdValue * 100) / 100 : null,
             aeroEarned,
             aeroEarnedUsd };
  });
}

// ── Wallet tokens (idle capital tracker) ─────────────────────────────────────
const WALLET_TOKENS = [
  { id: "wallet-base-usdc", chain: "base", asset: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6,  color: "#2775CA", price: "stable" },
  { id: "wallet-eth-usdc",  chain: "ethereum", asset: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6,  color: "#2775CA", price: "stable" },
  { id: "wallet-base-weth", chain: "base", asset: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, color: "#627EEA", price: "eth" },
];

async function fetchWalletTokens() {
  const byChain = groupBy(WALLET_TOKENS, t => t.chain);
  const [balances, ethPrice] = await Promise.all([
    Promise.allSettled(Object.entries(byChain).map(([chain, tokens]) => batchBalanceOf(chain, tokens))),
    fetchEthPrice(),
  ]);
  return balances.flatMap(r => r.status === "fulfilled" ? r.value : [])
    .map(t => {
      const usdValue = t.price === "stable" ? round(t.balance)
        : t.price === "eth" ? round(t.balance * ethPrice)
        : null;
      return { ...t, type: "wallet", ...(usdValue != null ? { usdValue } : {}) };
    });
}

// fetch with a hard timeout (CF subrequests can otherwise hang on slow/blocked upstreams).
async function tfetch(url, opts = {}, ms = 10000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); }
  finally { clearTimeout(t); }
}

// Spot price from Bybit (the user's reference venue) — null on failure/timeout.
async function fetchBybitPrice(symbol) {
  const r = await tfetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
    { headers: { "Accept": "application/json" } }, 3500).then(r => r.json()).catch(() => null);
  const p = Number(r?.result?.list?.[0]?.lastPrice);
  return p > 0 ? p : null;
}

// Current USD prices of the underlying tokens (for P&L growth-vs-yield split). USDC pinned to $1.
async function fetchAllPrices() {
  const [btc, eth, bera, aero] = await Promise.all([
    fetchBybitPrice("BTCUSDT"), fetchBybitPrice("ETHUSDT"), fetchBybitPrice("BERAUSDT"), fetchBybitPrice("AEROUSDT"),
  ]);
  return { USDC: 1, WBTC: btc, WETH: eth, WBERA: bera, AERO: aero };
}

// ETH/USD — prefer Bybit, fall back to Chainlink on Base.
async function fetchEthPrice() {
  const bybit = await fetchBybitPrice("ETHUSDT");
  if (bybit) return bybit;
  const res = await rpcCall("base", [{ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: CHAINLINK_ETH_USD, data: "0x50d25bcd" }, "latest"] }]);
  const raw = Array.isArray(res) ? res.find(r => r.id === 1)?.result : null;
  return raw && raw !== "0x" ? Number(BigInt(raw)) / 1e8 : 2500;
}

// ── Native ETH balances (Base + Ethereum mainnet) ────────────────────────────
async function fetchNativeBalances() {
  const LATEST_ANS_SEL = "0x50d25bcd";
  const [baseData, ethData, arbData] = await Promise.all([
    rpcCall("base", [
      { jsonrpc: "2.0", id: 1, method: "eth_call",      params: [{ to: CHAINLINK_ETH_USD, data: LATEST_ANS_SEL }, "latest"] },
      { jsonrpc: "2.0", id: 2, method: "eth_getBalance", params: [WALLET, "latest"] },
    ]),
    rpcCall("ethereum", [{ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [WALLET, "latest"] }]),
    rpcCall("arbitrum", [{ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [WALLET, "latest"] }]),
  ]);

  const priceRaw = Array.isArray(baseData) ? baseData.find(r => r.id === 1)?.result : null;
  const ethPrice = (await fetchEthPrice()) ?? (priceRaw && priceRaw !== "0x" ? Number(BigInt(priceRaw)) / 1e8 : 2500);

  const results = [];
  const addEth = (resArr, id, chain) => {
    const raw = Array.isArray(resArr) ? resArr.find(r => r.id === id)?.result : null;
    if (!raw || raw === "0x") return;
    const balance = Math.round(Number(BigInt(raw)) / 1e18 * 1e6) / 1e6;
    if (balance >= 0.0001) results.push({
      id: `wallet-${chain}-eth`, chain, asset: "ETH", color: "#627EEA",
      balance, usdValue: round(balance * ethPrice), type: "wallet",
    });
  };
  addEth(baseData, 2, "base");
  addEth(ethData,  1, "ethereum");
  addEth(arbData,  1, "arbitrum");
  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function batchBalanceOf(chain, tokens) {
  const walletHex = WALLET.toLowerCase().replace("0x", "").padStart(64, "0");
  const batch = tokens.map((t, i) => ({
    jsonrpc: "2.0", id: i,
    method: "eth_call",
    params: [{ to: t.address, data: BAL_SEL + walletHex }, "latest"],
  }));
  const results = await rpcCall(chain, batch);
  return tokens.map((t, i) => {
    const r = Array.isArray(results) ? results.find(x => x.id === i) : null;
    const raw = r?.result && r.result !== "0x" ? BigInt(r.result) : 0n;
    return { ...t, balance: round(Number(raw) / 10 ** t.decimals) };
  });
}

async function batchMorphoVaults(chain, vaults) {
  const walletHex = WALLET.toLowerCase().replace("0x", "").padStart(64, "0");
  // First batch: get share balances
  const shareBatch = vaults.map((v, i) => ({
    jsonrpc: "2.0", id: i,
    method: "eth_call",
    params: [{ to: v.address, data: BAL_SEL + walletHex }, "latest"],
  }));
  const shareResults = await rpcCall(chain, shareBatch);

  const withShares = vaults.map((v, i) => {
    const r = Array.isArray(shareResults) ? shareResults.find(x => x.id === i) : null;
    const shares = r?.result && r.result !== "0x" ? BigInt(r.result) : 0n;
    return { ...v, shares };
  }).filter(v => v.shares > 0n);

  if (withShares.length === 0) return vaults.map(v => ({ ...v, balance: 0 }));

  // Second batch: convertToAssets(shares) for non-zero positions
  const assetBatch = withShares.map((v, i) => ({
    jsonrpc: "2.0", id: i,
    method: "eth_call",
    params: [{ to: v.address, data: CONVERT_TO_ASSETS_SEL + v.shares.toString(16).padStart(64, "0") }, "latest"],
  }));
  const assetResults = await rpcCall(chain, assetBatch);

  const resolved = withShares.map((v, i) => {
    const r = Array.isArray(assetResults) ? assetResults.find(x => x.id === i) : null;
    const raw = r?.result && r.result !== "0x" ? BigInt(r.result) : 0n;
    const { shares: _shares, ...rest } = v;
    return { ...rest, balance: round(Number(raw) / 10 ** v.decimals) };
  });

  // Merge back: vaults with 0 shares get balance 0
  return vaults.map(v => resolved.find(r => r.id === v.id) ?? { ...v, balance: 0 });
}

// ── Aave V3 Ethereum: WBTC collateral + USDC variable debt ───────────────────
const AWBTC_ETH             = "0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8"; // aWBTC
const VAR_DEBT_USDC_ETH     = "0x72E95b8931767C79bA4EeE721354d6E99a61D004"; // variable debt USDC
const AAVE_POOL_ETH         = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"; // Aave V3 Pool Ethereum
const RESERVE_DATA_SEL      = "0x35ea6a75"; // getReserveData(address)
const WBTC_ADDR             = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const USDC_ADDR_ETH         = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Single-token USD price via DeFiLlama (key like "ethereum:0x..."); null on failure.
async function fetchTokenPriceLlama(key) {
  const r = await tfetch(`https://coins.llama.fi/prices/current/${key}`).then(r => r.json()).catch(() => null);
  return r?.coins?.[key]?.price ?? null;
}

function padAddr(addr) { return addr.toLowerCase().replace("0x","").padStart(64,"0"); }
// Extract APY% from Aave getReserveData response (ray = 1e27)
function aaveRate(hex, wordIdx) {
  const h = (hex || "").replace("0x","");
  const start = wordIdx * 64;
  if (h.length < start + 64) return null;
  const ray = BigInt("0x" + h.slice(start, start + 64));
  return Math.round(Number(ray) / 1e27 * 10000) / 100; // → %
}

async function fetchAaveEthereum() {
  const walletHex = WALLET.toLowerCase().replace("0x", "").padStart(64, "0");
  const batch = [
    { jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: AWBTC_ETH,         data: BAL_SEL + walletHex }, "latest"] },
    { jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: VAR_DEBT_USDC_ETH, data: BAL_SEL + walletHex }, "latest"] },
    // Aave reserve rates
    { jsonrpc: "2.0", id: 4, method: "eth_call", params: [{ to: AAVE_POOL_ETH, data: RESERVE_DATA_SEL + padAddr(WBTC_ADDR)    }, "latest"] },
    { jsonrpc: "2.0", id: 5, method: "eth_call", params: [{ to: AAVE_POOL_ETH, data: RESERVE_DATA_SEL + padAddr(USDC_ADDR_ETH) }, "latest"] },
  ];
  const [res, bybitBtc, wbtcPriceLlama] = await Promise.all([
    rpcCall("ethereum", batch),
    fetchBybitPrice("BTCUSDT"),
    fetchTokenPriceLlama(`ethereum:${WBTC_ADDR}`),
  ]);
  if (!Array.isArray(res)) return [];

  const wbtcHex    = res.find(r => r.id === 1)?.result;
  const debtHex    = res.find(r => r.id === 2)?.result;
  const wbtcRateHx = res.find(r => r.id === 4)?.result;
  const usdcRateHx = res.find(r => r.id === 5)?.result;

  // Prefer Bybit (user's reference), then DeFiLlama.
  const btcPrice   = bybitBtc ?? wbtcPriceLlama ?? 100000;
  const wbtcSupply = aaveRate(wbtcRateHx, 2); // word 2 = currentLiquidityRate
  const usdcBorrow = aaveRate(usdcRateHx, 4); // word 4 = currentVariableBorrowRate

  const positions = [];
  if (wbtcHex && wbtcHex !== "0x" && BigInt(wbtcHex) > 0n) {
    const balance  = Number(BigInt(wbtcHex)) / 1e8;
    const usdValue = round(balance * btcPrice);
    positions.push({ id: "aave-eth-wbtc", chain: "ethereum", protocol: "Aave V3", asset: "WBTC",
      balance, usdValue, type: "lending", color: "#B6509E",
      ...(wbtcSupply != null ? { apy: wbtcSupply } : {}),
    });
  }
  if (debtHex && debtHex !== "0x" && BigInt(debtHex) > 0n) {
    const debt = -round(Number(BigInt(debtHex)) / 1e6);
    positions.push({ id: "aave-eth-usdc-debt", chain: "ethereum", protocol: "Aave V3", asset: "USDC",
      balance: debt, usdValue: debt, type: "debt", color: "#FF6450",
      ...(usdcBorrow != null ? { apy: usdcBorrow } : {}),
    });
  }
  return positions;
}

// ── Lighter: Public Pools equity (no auth needed — user shares are static) ────
// User account_index: 729632
// Shares are static (change only on deposit/withdraw); pool TVL/shares fetched live.
const LIGHTER_POOLS = [
  { name: "Candle Effect v2",        pool_index: 281474976543116, user_shares: 47698  },
  { name: "K Pool",                  pool_index: 281474976680237, user_shares: 13092  },
  { name: "Edge & Hedge (L/S Factors)", pool_index: 281474976688087, user_shares: 33334 },
  { name: "Guinea Pool",             pool_index: 281474976694250, user_shares: 80128  },
];
const LIGHTER_API = "https://mainnet.zklighter.elliot.ai/api/v1/publicPoolsMetadata";

const LIGHTER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://app.lighter.xyz",
  "Referer": "https://app.lighter.xyz/",
};

async function fetchLighterPoolFresh(p) {
  const r = await tfetch(`${LIGHTER_API}?index=${p.pool_index + 1}&limit=1`, { headers: LIGHTER_HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const pool = data.public_pools?.[0];
  if (!pool) throw new Error("pool not found");
  const totalAsset = Number(pool.total_asset_value) || 0;
  const totalShares = Number(pool.total_shares) || 0;
  const equity = totalShares > 0 ? (p.user_shares / totalShares) * totalAsset : 0;
  const apy = pool.annual_percentage_yield > 0 ? round(pool.annual_percentage_yield) : null;
  return { name: p.name, equity: round(equity), apy };
}

async function fetchLighter() {
  const cache = caches.default;
  const pools = [];

  for (const p of LIGHTER_POOLS) {
    const cacheKey = `https://lighter-cache.internal/pool/${p.pool_index}`;
    let result = null;

    // Try fresh fetch
    try {
      result = await fetchLighterPoolFresh(p);
      // Cache successful result for 10 min
      const resp = new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", "Cache-Control": "max-age=600" },
      });
      await cache.put(cacheKey, resp);
    } catch (_) {
      // Fetch failed — try stale cache (ignoring max-age)
      const cached = await cache.match(cacheKey);
      if (cached) result = await cached.json().catch(() => null);
    }

    if (result) pools.push(result);
  }

  if (pools.length === 0) return [];

  const totalEquity = round(pools.reduce((s, p) => s + p.equity, 0));
  const avgApy = (() => {
    const active = pools.filter(p => p.apy != null && p.equity > 0);
    const w = active.reduce((s, p) => s + p.equity, 0);
    return w > 0 ? round(active.reduce((s, p) => s + p.apy * p.equity / w, 0)) : null;
  })();

  return [{
    id: "lighter-public-pools",
    chain: "lighter", protocol: "Lighter", asset: "Public Pools",
    balance: totalEquity, usdValue: totalEquity,
    type: "vault", color: "#4B8BFF",
    ...(avgApy != null ? { apy: avgApy } : {}),
    pools,
  }];
}

// ── Loopscale: leveraged loops on Solana (net equity = collateral − debt) ─────
// Public API (tars.loopscale.com, no auth, served by Google Frontend → not WAF-blocked).
// Net equity per loan = collateralUsd − principalUsd − interestAccruedUsd.
// Net APY = (Σ collateralYield − Σ borrowCost) / Σ netEquity.
const LOOPSCALE_BORROWER = "EBo4UTvn8HkjLGv23WqRWRwkRBkX81d1NYB8bgmBdshv";
const LOOPSCALE_API = "https://tars.loopscale.com/v1/markets/loans/info";
const SOLANA_RPC = "https://solana-rpc.publicnode.com";
// Loopscale "Earn" (OnRe Growth): share token + its vault. Value = shares · (assets/shares).
const ONRE_EARN_ATA   = "CkPQjD3c8VZhx7xeyT3gN4jvb5Wutdo9vqG1U2N4dgyt"; // borrower's OnRe share token account (direct, fast read)
const ONRE_EARN_VAULT = "9iPUphFXxnyAKYnCTG3XZv5ybHv5Ki1diqA5mis3TBVB";
const ONRE_VAULT_ASSETS_OFFSET = 20;  // u64 total assets (USDC, 6 dec)
const ONRE_VAULT_SHARES_OFFSET = 389; // u64 total shares
// Collateral mint → display symbol for loop rows.
const LOOPSCALE_COLLATERAL_SYMBOLS = {
  "5Y8NV33Vv7WbnLfq3zBcKSdYPrk7g2KoiQoe7M2tcxp5": "ONyc",
};

async function solRpc(method, params) {
  const r = await tfetch(SOLANA_RPC, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }, 8000).then(r => r.json()).catch(() => null);
  return r?.result ?? null;
}

// Loopscale Earn position (OnRe Growth) valued on-chain via vault share price.
// Resilient: caches last good value and returns it if the Solana RPC is slow/unavailable,
// so the row never silently disappears on a transient hiccup.
async function fetchLoopscaleEarn() {
  const cache = caches.default;
  const LAST = "https://loopscale.internal/onre-earn-last";
  const lastGood = async () => { const c = await cache.match(LAST); return c ? c.json().catch(() => null) : null; };

  const [bal, vault] = await Promise.all([
    solRpc("getTokenAccountBalance", [ONRE_EARN_ATA]),
    solRpc("getAccountInfo", [ONRE_EARN_VAULT, { encoding: "base64" }]),
  ]);
  const rawShares = bal?.value?.amount;
  const shares = Number(rawShares || 0);
  if (rawShares != null && shares <= 0) return null;
  if (!rawShares || !vault?.value?.data?.[0]) return await lastGood();
  const buf = Uint8Array.from(atob(vault.value.data[0]), c => c.charCodeAt(0));
  const u64 = (off) => { const dv = new DataView(buf.buffer); return Number(dv.getBigUint64(off, true)); };
  const assets = u64(ONRE_VAULT_ASSETS_OFFSET);
  const vShares = u64(ONRE_VAULT_SHARES_OFFSET);
  if (!vShares) return await lastGood();
  const price = assets / vShares;                 // USD per share (grows with yield)
  const usd = round(shares * price / 1e6);
  if (usd <= 0) return await lastGood();

  // Realized APY = annualized growth of the vault share price.
  // Baseline persisted in CF cache; seeded from the deposit point for an immediate figure.
  let apy = null;
  try {
    const cache = caches.default;
    const key = "https://loopscale.internal/onre-share-price-v1";
    const SEED = { price: 1.017521, ts: 1781452717 }; // deposit: 2026-06-14 share price
    let base = null;
    const cached = await cache.match(key);
    if (cached) base = await cached.json().catch(() => null);
    if (!base || !(base.price > 0)) {
      base = SEED;
      await cache.put(key, new Response(JSON.stringify({ price, ts: Math.floor(Date.now() / 1000) }),
        { headers: { "Cache-Control": "max-age=2592000" } }));
    }
    const dt = Math.floor(Date.now() / 1000) - base.ts;
    if (dt > 6 * 3600 && base.price > 0) {
      const a = (Math.pow(price / base.price, 31536000 / dt) - 1) * 100;
      if (a > 0 && a < 60) apy = round(a);
    }
  } catch (_) {}

  const result = { label: "OnRe Growth", usd, apy };
  await cache.put(LAST, new Response(JSON.stringify(result), { headers: { "Cache-Control": "max-age=604800" } }));
  return result;
}

async function fetchLoopscale() {
  const res = await tfetch(LOOPSCALE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ borrowers: [LOOPSCALE_BORROWER], filterType: 0, page: 0, pageSize: 25 }),
  }).then(r => r.json()).catch(() => null);

  const items = Array.isArray(res?.items) ? res.items : [];
  if (items.length === 0) return [];

  const loops = [];
  let totalEquity = 0, yieldSum = 0, costSum = 0;

  for (const it of items) {
    const collUsd = Number(it.collateralUsd) || 0;
    const prinUsd = Number(it.principalUsd) || 0;
    const intUsd  = Number(it.interestAccruedUsd) || 0;
    const equity  = collUsd - prinUsd - intUsd;
    if (equity <= 0) continue;

    // collateralYieldPct is a fraction (0.118 = 11.8%); ledger.apy is borrow rate scaled by 1e6.
    const collYieldPct = Number(it.collateralYieldPct) || 0;
    const borrowApy = it.ledgers?.length ? (Number(it.ledgers[0].apy) || 0) / 1e6 : 0;

    yieldSum += collYieldPct * collUsd;
    costSum  += borrowApy * prinUsd;
    totalEquity += equity;

    const loanApy = equity > 0 ? round((collYieldPct * collUsd - borrowApy * prinUsd) / equity * 100) : null;
    const sym = LOOPSCALE_COLLATERAL_SYMBOLS[it.collateral?.[0]?.assetMint] || "Loop";
    loops.push({
      address: it.loan?.address || null,
      label: sym,
      equity: round(equity),
      collateralUsd: round(collUsd),
      principalUsd: round(prinUsd),
      apy: loanApy,
      pnlUsd: it.pnlUsd != null ? round(Number(it.pnlUsd)) : null,
    });
  }

  const rows = [...loops];

  if (rows.length === 0) return [];

  // Card APY: value-weighted over rows that have a known APY.
  const apyRows = rows.filter(r => r.apy != null);
  const apyW = apyRows.reduce((s, r) => s + (r.usd ?? r.equity), 0);
  const netApy = apyW > 0 ? round(apyRows.reduce((s, r) => s + r.apy * (r.usd ?? r.equity), 0) / apyW) : null;

  return [{
    id: "loopscale-loops",
    chain: "solana", protocol: "Loopscale", asset: "ONyc Loop",
    balance: round(totalEquity), usdValue: round(totalEquity),
    type: "vault", color: "#14F195",
    ...(netApy != null ? { apy: netApy } : {}),
    loops: rows,
  }];
}

// ── Kodiak (Berachain): Bault (ERC4626) wrapping a Kodiak Island LP ───────────
// Bault.balanceOf → shares; assets = shares·totalAssets/totalSupply = Island LP tokens.
// Island.getUnderlyingBalances() → (WETH, WBERA); value = islandShare·(WETH·ethPx + WBERA·beraPx).
const KODIAK_BAULT  = "0x1e93e62F4a6f2B4C6b3f997E11B34491ca892059"; // Bault-Kodiak Island WETH-WBERA
const KODIAK_ISLAND = "0x9659dc8c1565e0bd82627267e3b4eed1a377ebe6"; // Kodiak Island WETH/WBERA
const TOTAL_SUPPLY_SEL_K = "0x18160ddd"; // totalSupply()
const TOTAL_ASSETS_SEL   = "0x01e1d114"; // totalAssets()
const UNDERLYING_BAL_SEL = "0x1322d954"; // getUnderlyingBalances()

// WETH + WBERA prices on Berachain via DeFiLlama (works from CF workers, unlike CoinGecko).
const KODIAK_WETH  = "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590";
const KODIAK_WBERA = "0x6969696969696969696969696969696969696969";
async function fetchKodiakPrices() {
  const key = a => `berachain:${a}`;
  const [bEth, bBera, r] = await Promise.all([
    fetchBybitPrice("ETHUSDT"),
    fetchBybitPrice("BERAUSDT"),
    tfetch(`https://coins.llama.fi/prices/current/${key(KODIAK_WETH)},${key(KODIAK_WBERA)}`).then(r => r.json()).catch(() => null),
  ]);
  const coins = r?.coins || {};
  return {
    eth:  bEth  ?? coins[key(KODIAK_WETH)]?.price  ?? null,
    bera: bBera ?? coins[key(KODIAK_WBERA)]?.price ?? null,
  };
}

// Kodiak Island APR (base fees + farm) via Kodiak backend, keyed by island address.
async function fetchKodiakApr() {
  const r = await tfetch("https://backend.kodiak.finance/vaults?chainId=80094&orderBy=totalApr&orderDirection=desc",
    { headers: { "Accept": "application/json" } }).then(r => r.json()).catch(() => null);
  const arr = Array.isArray(r) ? r : (r?.data || r?.vaults || []);
  const v = arr.find(x => (x.id || x.address || "").toLowerCase() === KODIAK_ISLAND.toLowerCase());
  return v?.totalApr != null ? round(Number(v.totalApr)) : null;
}

async function fetchKodiak() {
  const walletHex = WALLET.toLowerCase().replace("0x", "").padStart(64, "0");
  const [data, prices, kodiakApr] = await Promise.all([
    rpcCall("bera", [
      { jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: KODIAK_BAULT,  data: BAL_SEL + walletHex }, "latest"] },
      { jsonrpc: "2.0", id: 2, method: "eth_call", params: [{ to: KODIAK_BAULT,  data: TOTAL_SUPPLY_SEL_K  }, "latest"] },
      { jsonrpc: "2.0", id: 3, method: "eth_call", params: [{ to: KODIAK_BAULT,  data: TOTAL_ASSETS_SEL    }, "latest"] },
      { jsonrpc: "2.0", id: 4, method: "eth_call", params: [{ to: KODIAK_ISLAND, data: UNDERLYING_BAL_SEL  }, "latest"] },
      { jsonrpc: "2.0", id: 5, method: "eth_call", params: [{ to: KODIAK_ISLAND, data: TOTAL_SUPPLY_SEL_K  }, "latest"] },
    ]),
    fetchKodiakPrices(),
    fetchKodiakApr(),
  ]);
  const ethPrice = prices.eth, beraPrice = prices.bera;

  if (!Array.isArray(data)) return [];
  const get = id => { const r = data.find(x => x.id === id)?.result; return r && r !== "0x" ? BigInt(r) : 0n; };
  const shares      = get(1);
  const baultSupply = get(2);
  const baultAssets = get(3);
  const underlying  = data.find(x => x.id === 4)?.result;
  const islandSupply = get(5);
  if (shares === 0n || baultSupply === 0n || islandSupply === 0n || !underlying || underlying === "0x") return [];

  const h = underlying.replace("0x", "");
  const amt0 = Number(BigInt("0x" + h.slice(0, 64)))   / 1e18; // WETH (18)
  const amt1 = Number(BigInt("0x" + h.slice(64, 128)))  / 1e18; // WBERA (18)

  // userIslandTokens = shares · baultAssets / baultSupply  (all 18 dec)
  const userIsland = Number(shares) * Number(baultAssets) / Number(baultSupply) / 1e18;
  const islandShare = userIsland / (Number(islandSupply) / 1e18);
  const wethAmt  = islandShare * amt0;
  const weraAmt  = islandShare * amt1;
  if (beraPrice == null || ethPrice == null) return []; // can't value — skip rather than under-report
  const usdValue = round(wethAmt * ethPrice + weraAmt * beraPrice);
  if (usdValue < 1) return [];

  return [{
    id: "kodiak-bault-weth-wbera",
    chain: "berachain", protocol: "Kodiak", asset: "WETH/WBERA",
    balance: usdValue, usdValue,
    type: "vault", color: "#5BC0EB",
    ...(kodiakApr != null ? { apy: kodiakApr } : {}),
  }];
}

// ── Hyperliquid: vault equity + APR from vaultDetails ────────────────────────
async function fetchHyperliquid() {
  const res = await tfetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "userVaultEquities", user: WALLET }),
  }).then(r => r.json()).catch(() => []);
  if (!Array.isArray(res)) return [];
  const active = res.filter(v => parseFloat(v.equity) >= 1);
  if (active.length === 0) return [];

  // Fetch APR for each vault from vaultDetails
  const details = await Promise.allSettled(
    active.map(v =>
      tfetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vaultDetails", vaultAddress: v.vaultAddress }),
      }).then(r => r.json())
    )
  );

  return active.map((v, i) => {
    const d = details[i]?.status === "fulfilled" ? details[i].value : null;
    const apy = d?.apr != null ? Math.round(d.apr * 100 * 100) / 100 : null; // fraction → %
    return {
      id: `hl-${v.vaultAddress.slice(2, 8)}`,
      chain: "hyperliquid", protocol: "Hyperliquid", asset: "USDC",
      balance: round(parseFloat(v.equity)),
      usdValue: round(parseFloat(v.equity)),
      type: "vault", color: "#00E5FF",
      ...(apy != null ? { apy } : {}),
    };
  });
}

function groupBy(arr, fn) {
  return arr.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
}

function round(n) { return Math.round(n * 100) / 100; }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
