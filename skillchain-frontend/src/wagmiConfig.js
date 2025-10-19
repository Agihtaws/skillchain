// src/wagmiConfig.js
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

// You can add more chains here if your dapp supports them
const chains = [baseSepolia];

export const config = getDefaultConfig({
  appName: 'SkillChain Admin Dashboard',
  projectId: '9e40bdaa4ad54dda337d19b734967075', // Get your WalletConnect project ID from cloud.walletconnect.com
  chains: chains,
});

export { chains };
