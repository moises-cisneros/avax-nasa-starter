# AVAX x NASA Starter

Kit de inicio para el reto **"Field Shift: Adapting Farms with NASA Data"** en **Avalanche Fuji Testnet**.

Con este proyecto aprenderás a conectar **Core Wallet**, cambiar automáticamente a la red Fuji, leer datos de un contrato inteligente y **firmar una transacción on-chain** en vivo.

**Stack:** pnpm workspaces + Hardhat (`packages/contracts`) + Vite / React / Viem / Tailwind (`packages/frontend`).

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- [Core Wallet](https://core.app) instalada en tu navegador

No necesitas instalar nada más: funciona igual en Windows, Mac y Linux.

## Inicio rápido (1 minuto)

```bash
pnpm install
pnpm dev        # abre http://localhost:5173
```

1. Pulsa **Conectar Core Wallet** (la app cambia sola a Avalanche Fuji).
2. Pulsa **Autocompletar datos satelitales NASA** para rellenar el formulario.
3. Pulsa **Firmar y Registrar en Avalanche con Core Wallet** y confirma en la wallet.
4. Verás el hash de tu transacción con un enlace a Snowtrace y tu reporte en la lista.

Puedes salir con el botón **Desconectar** del encabezado.

> Necesitas AVAX de prueba para pagar el gas. Pídelo gratis en el faucet: <https://core.app/tools/testnet-faucet/?subnet=c&token=c>

## Desplegar tu propio contrato (opcional)

El proyecto ya apunta a un contrato desplegado, así que **no necesitas desplegar nada** para el taller. Si quieres tener el tuyo:

1. Copia el archivo de ejemplo: `cp packages/contracts/.env.example packages/contracts/.env`
2. Edita `packages/contracts/.env` y pega la llave privada de una **wallet de prueba** (nunca una con fondos reales).
3. Consigue AVAX de Fuji en el faucet de arriba.
4. Ejecuta `pnpm deploy:fuji`.

El script despliega `AgroLogNASA` y reescribe automáticamente `packages/frontend/src/contracts/deployedContract.ts` con la nueva dirección y el ABI.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm install` | Instala todo el monorepo |
| `pnpm dev` | Levanta el frontend en Vite |
| `pnpm compile` | Compila el contrato con Hardhat |
| `pnpm deploy:fuji` | Despliega en Fuji y sincroniza dirección + ABI con el frontend |
| `pnpm build` | Verifica los tipos y construye el frontend |

## Estructura

```text
avax-nasa-starter/
├── package.json, pnpm-workspace.yaml
└── packages/
    ├── contracts/            # Hardhat + Solidity
    │   ├── contracts/AgroLogNASA.sol
    │   ├── scripts/deploy.ts # Despliega y exporta ABI + dirección al frontend
    │   └── hardhat.config.ts # Red Avalanche Fuji (43113)
    └── frontend/             # Vite + React + Viem + Tailwind
        └── src/
            ├── App.tsx                       # Interfaz y flujo de firma
            ├── lib/wallet.ts                 # Detección de wallet y cambio a Fuji
            └── contracts/deployedContract.ts # AUTO-GENERADO (dirección + ABI)
```

## Cómo funciona el contrato

`AgroLogNASA` guarda reportes con: agricultor (quien firma), parcela, humedad del suelo, decisión de siembra y fecha.

- `registrarReporte(parcela, humedad, decision)`: guarda un reporte y emite el evento `NuevoReporteRegistrado`.
- `obtenerTotalReportes()`: cantidad total de reportes.
- `obtenerUltimosReportes()`: los últimos 10 reportes.

## Problemas frecuentes

- **"No se detectó ninguna wallet"**: instala [Core Wallet](https://core.app) y recarga la página.
- **La transacción falla por fondos**: te falta AVAX de prueba, usa el faucet.
- **`pnpm deploy:fuji` dice que no hay cuenta**: revisa que `PRIVATE_KEY` esté en `packages/contracts/.env`.
