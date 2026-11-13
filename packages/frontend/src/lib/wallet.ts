import { createPublicClient, createWalletClient, custom, http } from "viem";
import { avalancheFuji } from "viem/chains";

export const FUJI_CHAIN_ID_HEX = "0xa869"; // 43113
export const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
export const EXPLORER = "https://testnet.snowtrace.io";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    avalanche?: Eip1193Provider; // Core Wallet (native)
    ethereum?: Eip1193Provider; // Generic fallback
  }
}

/** Prefer Core Wallet (window.avalanche); fall back to window.ethereum. */
export function getProvider(): Eip1193Provider | undefined {
  return window.avalanche ?? window.ethereum;
}

/** Read-only client: no wallet needed, uses the public Fuji RPC. */
export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(FUJI_RPC),
});

export function getWalletClient(provider: Eip1193Provider) {
  return createWalletClient({ chain: avalancheFuji, transport: custom(provider) });
}

/** Make sure the wallet is on Fuji; add the network if the wallet doesn't know it. */
export async function ensureFuji(provider: Eip1193Provider) {
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (current.toLowerCase() === FUJI_CHAIN_ID_HEX) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FUJI_CHAIN_ID_HEX }],
    });
  } catch (err: any) {
    // 4902 = the chain is not added to the wallet yet
    if (err?.code === 4902 || err?.data?.originalError?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: FUJI_CHAIN_ID_HEX,
            chainName: "Avalanche Fuji Testnet",
            nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
            rpcUrls: [FUJI_RPC],
            blockExplorerUrls: [EXPLORER],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
