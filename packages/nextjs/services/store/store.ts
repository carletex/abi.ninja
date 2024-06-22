import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  braveWallet,
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Abi, Address } from "viem";
import * as chains from "viem/chains";
import { configureChains, createConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import create from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { burnerWalletConfig } from "~~/services/web3/wagmi-burner/burnerWalletConfig";
import { getTargetNetworks } from "~~/utils/scaffold-eth";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";

export const configureWagmi = (additionalNetworks: ChainWithAttributes[] = []) => {
  const targetNetworks = [...getTargetNetworks(), ...additionalNetworks];
  const { onlyLocalBurnerWallet } = scaffoldConfig;

  const enabledChains = targetNetworks.find(network => network.id === 1)
    ? targetNetworks
    : [...targetNetworks, chains.mainnet];

  const appChains = configureChains(
    enabledChains,
    [
      alchemyProvider({
        apiKey: scaffoldConfig.alchemyApiKey,
      }),
      publicProvider(),
    ],
    {
      stallTimeout: 3_000,
      pollingInterval: scaffoldConfig.pollingInterval,
    },
  );

  const walletsOptions = { chains: appChains.chains, projectId: scaffoldConfig.walletConnectProjectId };
  const wallets = [
    metaMaskWallet({ ...walletsOptions, shimDisconnect: true }),
    walletConnectWallet(walletsOptions),
    ledgerWallet(walletsOptions),
    braveWallet(walletsOptions),
    coinbaseWallet({ ...walletsOptions, appName: "scaffold-eth-2" }),
    rainbowWallet(walletsOptions),
    ...(!targetNetworks.some(network => network.id !== chains.hardhat.id) || !onlyLocalBurnerWallet
      ? [
          burnerWalletConfig({
            chains: appChains.chains.filter(chain => targetNetworks.map(({ id }) => id).includes(chain.id)),
          }),
        ]
      : []),
    safeWallet({ ...walletsOptions }),
  ];

  const newConnectors = connectorsForWallets([
    {
      groupName: "Supported Wallets",
      wallets,
    },
  ]);

  const wagmiConfig = createConfig({
    autoConnect: false,
    connectors: newConnectors,
    publicClient: appChains.publicClient,
  });

  return { wagmiConfig, appChains };
};

type GlobalState = {
  nativeCurrencyPrice: number;
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
  wagmiConfig: ReturnType<typeof configureWagmi>["wagmiConfig"];
  appChains: ReturnType<typeof configureWagmi>["appChains"];
  additionalNetworks: ChainWithAttributes[];
  addCustomChain: (newNetwork: ChainWithAttributes) => void;
  updateWagmiConfig: () => void;
};

type AbiNinjaState = {
  mainChainId: number;
  setMainChainId: (newMainChainId: number) => void;
  contractAbi: Abi;
  setContractAbi: (newAbi: Abi) => void;
  abiContractAddress: Address;
  setAbiContractAddress: (newAbiContractAddress: Address) => void;
  implementationAddress: Address;
  setImplementationAddress: (newImplementationAddress: Address) => void;
};

export const useGlobalState = create<GlobalState>(set => {
  const { wagmiConfig, appChains } = configureWagmi();
  return {
    nativeCurrencyPrice: 0,
    setNativeCurrencyPrice: (newValue: number): void => set(() => ({ nativeCurrencyPrice: newValue })),
    targetNetwork: scaffoldConfig.targetNetworks[1],
    setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
    wagmiConfig,
    appChains,
    additionalNetworks: [],
    addCustomChain: (newNetwork: ChainWithAttributes) =>
      set(state => {
        const updatedNetworks = [...state.additionalNetworks, newNetwork];
        const { wagmiConfig, appChains } = configureWagmi(updatedNetworks);
        return {
          additionalNetworks: updatedNetworks,
          wagmiConfig,
          appChains,
        };
      }),
    updateWagmiConfig: () =>
      set(state => {
        const { wagmiConfig, appChains } = configureWagmi(state.additionalNetworks);
        return { wagmiConfig, appChains };
      }),
  };
});

export const useAbiNinjaState = create<AbiNinjaState>(set => ({
  mainChainId: scaffoldConfig.targetNetworks[1].id,
  setMainChainId: (newValue: number): void => set(() => ({ mainChainId: newValue })),
  contractAbi: [],
  setContractAbi: (newAbi: Abi): void => set({ contractAbi: newAbi }),
  abiContractAddress: "",
  setAbiContractAddress: (newAddress: Address): void => set({ abiContractAddress: newAddress }),
  implementationAddress: "",
  setImplementationAddress: (newAddress: Address): void => set({ implementationAddress: newAddress }),
}));
