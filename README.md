---
title: NearScope
emoji: 🌐
colorFrom: blue
colorTo: green
sdk: static
app_build_command: npm run build
app_file: dist/index.html
---

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

## Deploy on Hugging Face Spaces

This repository is configured for a **Static HTML Space**. Create a new Space, choose the **Static** SDK, and publish the app files to that Space. The Space build settings use `npm run build` and serve `dist/index.html`.

NearScope is a community-built dashboard and is not an official NEAR Protocol product.
