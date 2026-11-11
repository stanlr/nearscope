# NearScope

A lightweight, read-only dashboard for the NEAR Protocol mainnet. NearScope surfaces live network status, finalized block progression, current validators, and recent blocks.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Data

The dashboard reads directly from the public NEAR mainnet JSON-RPC endpoint:

`https://rpc.mainnet.near.org`

It uses the `status`, `validators`, and `block` RPC methods. Data refreshes every 30 seconds. No wallet connection or API key is required.

## Deploy to Netlify

1. Sign in to Netlify and choose **Add new site → Import an existing project**.
2. Connect GitHub and select `stanlr/nearscope`.
3. Set the build command to `npm run build`.
4. Set the publish directory to `dist`.
5. Deploy.

NearScope is a community-built dashboard and is not an official NEAR Protocol product.
