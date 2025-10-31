# JATEVO x402 SDK Source Code

This folder contains the source code for the `jatevo-x402-sdk` npm package (v1.1.0).

## Structure

- `src/` - TypeScript source code
  - `index.ts` - Main exports
  - `client.ts` - X402Client class
  - `payment.ts` - Base payment handler
  - `solana-payment.ts` - Solana payment handler
  - `types.ts` - TypeScript type definitions
  - `constants.ts` - Network constants
- `dist/` - Compiled JavaScript output
- `package.json` - NPM package configuration
- `tsconfig.json` - TypeScript configuration

## Installation from NPM

```bash
npm install jatevo-x402-sdk
```

## Building from Source

If you want to build the SDK from source:

```bash
cd sdk
npm install
npm run build
```

## License

MIT