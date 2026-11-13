import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contracts/deployedContract";
import {
  EXPLORER,
  FUJI_CHAIN_ID_HEX,
  ensureFuji,
  getProvider,
  getWalletClient,
  publicClient,
  shortAddress,
} from "./lib/wallet";

type Reporte = {
  agricultor: Address;
  parcela: string;
  humedadSuelo: bigint;
  decisionSiembra: string;
  timestamp: bigint;
};

const DEMO = {
  parcela: "Valle Moquegua - Sector A",
  humedad: "28",
  decision: "Sembrar Quinua - Riego por goteo activado",
};

const DESCONECTADO_KEY = "agrolog:desconectado";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-carbon px-3 py-2 outline-none focus:border-avax";

export default function App() {
  const [account, setAccount] = useState<Address | null>(null);
  const [onFuji, setOnFuji] = useState(false);
  const [parcela, setParcela] = useState(DEMO.parcela);
  const [humedad, setHumedad] = useState(DEMO.humedad);
  const [decision, setDecision] = useState(DEMO.decision);
  const [status, setStatus] = useState<"idle" | "signing" | "confirming">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [total, setTotal] = useState<bigint>(0n);

  const provider = getProvider();

  const cargarReportes = useCallback(async () => {
    try {
      const [lista, cantidad] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "obtenerUltimosReportes",
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "obtenerTotalReportes",
        }),
      ]);
      setReportes([...(lista as readonly Reporte[])].reverse());
      setTotal(cantidad as bigint);
    } catch {
      // Contrato aún no desplegado en esta dirección: lista vacía.
      setReportes([]);
    }
  }, []);

  // Lista en vivo: carga inicial + refresco cada 5 s.
  useEffect(() => {
    cargarReportes();
    const id = setInterval(cargarReportes, 5000);
    return () => clearInterval(id);
  }, [cargarReportes]);

  // Mantener cuenta y red sincronizadas con la wallet.
  useEffect(() => {
    if (!provider?.on) return;
    const onAccounts = (accs: string[]) => setAccount((accs[0] as Address) ?? null);
    const onChain = (id: string) => setOnFuji(id.toLowerCase() === FUJI_CHAIN_ID_HEX);
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [provider]);

  // Reconexión automática al recargar (sin popup), salvo que el usuario se haya desconectado.
  useEffect(() => {
    if (!provider || localStorage.getItem(DESCONECTADO_KEY) === "1") return;
    (async () => {
      try {
        const accs = (await provider.request({ method: "eth_accounts" })) as string[];
        if (accs[0]) {
          setAccount(accs[0] as Address);
          const id = (await provider.request({ method: "eth_chainId" })) as string;
          setOnFuji(id.toLowerCase() === FUJI_CHAIN_ID_HEX);
        }
      } catch {
        /* sin permisos previos: el usuario pulsará "Conectar" */
      }
    })();
  }, [provider]);

  async function desconectar() {
    // EIP-1193 no tiene "disconnect": olvidamos la sesión en la app y,
    // si la wallet lo soporta, revocamos el permiso del sitio.
    localStorage.setItem(DESCONECTADO_KEY, "1");
    setAccount(null);
    setOnFuji(false);
    setTxHash(null);
    setError(null);
    try {
      await provider?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      /* la wallet no soporta revocar: la desconexión local basta */
    }
  }

  async function conectar() {
    if (!provider) return;
    setError(null);
    try {
      const accs = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      localStorage.removeItem(DESCONECTADO_KEY);
      await ensureFuji(provider);
      setAccount(accs[0] as Address);
      setOnFuji(true);
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "No se pudo conectar la wallet");
    }
  }

  async function registrar() {
    if (!provider || !account) return;
    setError(null);
    setTxHash(null);
    try {
      await ensureFuji(provider);
      setOnFuji(true);
      setStatus("signing");
      const wallet = getWalletClient(provider);
      const hash = await wallet.writeContract({
        account,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registrarReporte",
        args: [parcela, BigInt(humedad), decision],
      });
      setStatus("confirming");
      await publicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
      await cargarReportes();
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "La transacción falló");
    } finally {
      setStatus("idle");
    }
  }

  const humedadValida = humedad !== "" && Number(humedad) >= 0 && Number(humedad) <= 100;
  const formOk = parcela.trim() !== "" && decision.trim() !== "" && humedadValida;
  const busy = status !== "idle";

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-avax">▲</span>
            <span className="font-semibold">AgroLog NASA</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`rounded-full border px-3 py-1 ${
                onFuji ? "border-avax/50 text-avax" : "border-white/10 text-zinc-400"
              }`}
            >
              Avalanche Fuji Testnet
            </span>
            {account ? (
              <>
                <span className="rounded-full bg-card px-3 py-1 font-mono">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                  {shortAddress(account)}
                </span>
                <button
                  onClick={desconectar}
                  className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:border-avax hover:text-avax"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <span className="text-zinc-500">Sin conectar</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section>
          <h1 className="text-2xl font-bold">Field Shift: Adapting Farms with NASA Data</h1>
          <p className="mt-1 text-zinc-400">
            Registra una decisión agrícola basada en datos satelitales directamente en Avalanche.
          </p>
        </section>

        {!provider && (
          <div className="rounded-xl border border-avax/40 bg-card p-5">
            <p className="mb-3">No se detectó ninguna wallet. Instala Core Wallet para continuar.</p>
            <a
              href="https://core.app"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg bg-avax px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              Descargar Core Wallet
            </a>
          </div>
        )}

        {provider && !account && (
          <button
            onClick={conectar}
            className="rounded-lg bg-avax px-5 py-3 font-semibold text-white hover:opacity-90"
          >
            Conectar Core Wallet
          </button>
        )}

        <section className="space-y-4 rounded-xl border border-white/10 bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Nuevo reporte</h2>
            <button
              type="button"
              onClick={() => {
                setParcela(DEMO.parcela);
                setHumedad(DEMO.humedad);
                setDecision(DEMO.decision);
              }}
              className="text-sm text-avax hover:underline"
            >
              Autocompletar datos satelitales NASA
            </button>
          </div>

          <label className="block text-sm">
            <span className="text-zinc-400">Nombre / Sector de Parcela</span>
            <input value={parcela} onChange={(e) => setParcela(e.target.value)} className={inputClass} />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">Humedad del Suelo % (NASA SMAP)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={humedad}
              onChange={(e) => setHumedad(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="text-zinc-400">Acción Agrícola Recomendada</span>
            <input value={decision} onChange={(e) => setDecision(e.target.value)} className={inputClass} />
          </label>

          <button
            onClick={registrar}
            disabled={!account || !formOk || busy}
            className="w-full rounded-lg bg-avax px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "signing"
              ? "Esperando firma en Core Wallet..."
              : status === "confirming"
                ? "Confirmando en Avalanche..."
                : "Registrar"}
          </button>
          {!account && provider && (
            <p className="text-xs text-zinc-500">Conecta tu wallet para poder firmar.</p>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {txHash && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4">
            <p className="font-semibold text-green-400">¡Reporte registrado on-chain!</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-300">{txHash}</p>
            <a
              href={`${EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-lg bg-avax px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Ver en Snowtrace Testnet
            </a>
          </div>
        )}

        <section>
          <h2 className="mb-3 font-semibold">
            Reportes on-chain <span className="text-zinc-500">({total.toString()} en total)</span>
          </h2>
          {reportes.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-card p-4 text-sm text-zinc-500">
              Aún no hay reportes. ¡Sé el primero en registrar uno!
            </p>
          ) : (
            <ul className="space-y-3">
              {reportes.map((r, i) => (
                <li key={`${r.timestamp}-${i}`} className="rounded-xl border border-white/10 bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{r.parcela}</span>
                    <span className="rounded-full bg-avax/15 px-2 py-0.5 text-xs text-avax">
                      Humedad {r.humedadSuelo.toString()}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">{r.decisionSiembra}</p>
                  <p className="mt-2 font-mono text-xs text-zinc-500">
                    {shortAddress(r.agricultor)} · {new Date(Number(r.timestamp) * 1000).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
