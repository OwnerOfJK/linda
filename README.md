# Linda

A privacy-focused real-time location tracking app that connects friends worldwide.

## Overview

Linda enables friends to share their locations in real-time while maintaining complete control over their privacy. Built for ETHGlobal Buenos Aires, the app demonstrates how trusted execution environments (TEEs) and blockchain technology can create a secure, privacy-preserving location sharing experience.

## Key Features

- **Privacy-First Design**: Users control their location sharing granularity (exact coordinates vs. city-level)
- **Real-Time Updates**: WebSocket-powered live location broadcasting to friends
- **Confidential Computation**: Backend runs inside Oasis ROFL TEE for tamper-proof execution
- **Privacy-Preserving Identity**: Self Protocol integration for anonymous age and country verification
- **Cross-Platform**: React Native app works on iOS, Android, and web

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Oasis ROFL (Runtime Off-chain Logic) with TypeScript, Express, and WebSocket
- **Smart Contracts**: Solidity on Celo (Sepolia testnet and Mainnet)
- **Identity**: Self Protocol for zero-knowledge identity verification
- **Database**: SQLite encrypted within TEE

## Architecture

```
Mobile App (React Native)
    ↓ HTTPS/WSS
Backend API (Express + WebSocket in ROFL TEE)
    ↓ SQLite (encrypted in TEE)
Privacy-controlled location sharing
    ↓ WebSocket broadcast
Real-time updates to friends
```

## Repository Structure

```
linda/
├── frontend/          # React Native (Expo) mobile app
├── oasis/             # ROFL backend (TypeScript + Express + WebSocket)
├── contracts/         # Solidity contracts (Foundry)
├── CLAUDE.md          # Development guide
├── CONNECT.md         # Frontend-backend integration guide
└── TESTING.md         # Testing procedures
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd oasis
npm install
docker compose up --build
```

### Contracts
```bash
cd contracts
npm install
forge build
```

For detailed setup instructions, see [CLAUDE.md](./CLAUDE.md).

## Privacy Model

- **Friend-Only Sharing**: Location data only shared with bidirectional friends
- **Granular Privacy**: Choose between exact GPS coordinates or city-level sharing
- **No History**: Only current location stored, no tracking history
- **TEE Enforcement**: Privacy rules enforced inside trusted execution environment
- **Verifiable Security**: Remote attestation ensures code integrity

## Deployed Contracts

- **Celo Sepolia**: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- **Celo Mainnet**: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide
- [CONNECT.md](./CONNECT.md) - Frontend-backend integration
- [TESTING.md](./TESTING.md) - Testing procedures

## Built With

- [Oasis ROFL](https://docs.oasis.io/rofl/) - Confidential off-chain computation
- [Self Protocol](https://www.selfprotocol.com/) - Privacy-preserving identity
- [Expo](https://expo.dev/) - React Native framework
- [Celo](https://celo.org/) - Mobile-first blockchain

---

Built for ETHGlobal Buenos Aires 2024
