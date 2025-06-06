import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export const WalletProvider = ({ children }) => (
  <AptosWalletAdapterProvider
    optInWallets={["Petra"]}
    autoConnect={true}
    dappConfig={{ network: Network.TESTNET }}
    onError={console.error}
  >
    {children}
  </AptosWalletAdapterProvider>
);
