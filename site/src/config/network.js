// src/config/network.js

export const NETWORK = {
  name:        "KARKAS",
  chainId:     144411,
  chainIdHex:  "0x" + (144411).toString(16),
  symbol:      "KRKS",
  decimals:    18,
  rpcUrl:      "https://rpc.marakyja.xyz",
  explorerUrl: "https://explorer.marakyja.xyz",
  faucetUrl:   "https://faucet.marakyja.xyz",
};

// ── Paste your deployed contract address after running deploy.js ──────────────
export const ROULETTE_ADDRESS = "0x0000000000000000000000000000000000000000";
// ─────────────────────────────────────────────────────────────────────────────

export const ROULETTE_ABI = [
  // Player
  "function requestSpin() payable",
  "function refundExpired(uint256 id)",
  // View
  "function prizePool()    view returns (uint256)",
  "function getBetLimits() view returns (uint256 min, uint256 max)",
  "function getRequest(uint256 id) view returns (tuple(address player, uint256 bet, uint256 requestBlock, uint8 state))",
  "function activeRequest(address) view returns (uint256)",
  "function totalSpins()   view returns (uint256)",
  "function TIMEOUT_BLOCKS() view returns (uint256)",
  // Events
  "event RequestRandom(uint256 indexed id, address indexed player, uint256 bet, uint256 requestBlock)",
  "event SpinResult(uint256 indexed id, address indexed player, uint256 bet, uint256 payout, uint8 rarity, uint8 multX10)",
  "event BetRefunded(uint256 indexed id, address indexed player, uint256 bet)",
];

export const RARITY_INFO = [
  { id: 0, name: "Common",    emoji: "💀", label: "Miss",  mult: 0,   multX10: 0,   color: "#718096", prob: "50%" },
  { id: 1, name: "Uncommon",  emoji: "🔵", label: "×1.5", mult: 1.5, multX10: 15,  color: "#4299e1", prob: "25%" },
  { id: 2, name: "Rare",      emoji: "💜", label: "×2",   mult: 2,   multX10: 20,  color: "#9f7aea", prob: "15%" },
  { id: 3, name: "Epic",      emoji: "⭐", label: "×5",   mult: 5,   multX10: 50,  color: "#F7DD7D", prob:  "8%" },
  { id: 4, name: "Legendary", emoji: "🔥", label: "×10",  mult: 10,  multX10: 100, color: "#fc8181", prob:  "2%" },
];

export const IS_DEPLOYED =
  ROULETTE_ADDRESS !== "0x0000000000000000000000000000000000000000";
