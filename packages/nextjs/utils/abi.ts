import { isZeroAddress } from "./scaffold-eth/common";
import { Abi, Address, Chain } from "viem";

const ABI_STORAGE_KEY = "abi_ninja_storage";

type AbiStorage = {
  version: string;
  abis: Record<string, Abi>;
};

const getAbiStorage = (): AbiStorage => {
  if (typeof window === "undefined") return { version: "1.0", abis: {} };
  try {
    const storage = localStorage.getItem(ABI_STORAGE_KEY);
    return storage ? JSON.parse(storage) : { version: "1.0", abis: {} };
  } catch (error) {
    console.error("Failed to get ABI storage:", error);
    return { version: "1.0", abis: {} };
  }
};

const saveAbiStorage = (storage: AbiStorage) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ABI_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save ABI storage:", error);
  }
};

export const getAbiFromLocalStorage = (contractAddress: string): Abi | null => {
  if (typeof window === "undefined") return null;
  try {
    const storage = getAbiStorage();
    return storage.abis[contractAddress.toLowerCase()] || null;
  } catch (error) {
    console.error("Failed to get ABI from localStorage:", error);
    return null;
  }
};

export const saveAbiToLocalStorage = (contractAddress: string, abi: Abi) => {
  if (typeof window === "undefined") return;
  try {
    const storage = getAbiStorage();
    storage.abis[contractAddress.toLowerCase()] = abi;
    saveAbiStorage(storage);
  } catch (error) {
    console.error("Failed to save ABI to localStorage:", error);
  }
};

export const removeAbiFromLocalStorage = (contractAddress: string) => {
  if (typeof window === "undefined") return;
  try {
    const storage = getAbiStorage();
    delete storage.abis[contractAddress.toLowerCase()];
    saveAbiStorage(storage);
  } catch (error) {
    console.error("Failed to remove ABI from localStorage:", error);
  }
};

export const fetchContractABIFromEtherscan = async (verifiedContractAddress: Address, chainId: number) => {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_V2_API_KEY;

  // First call to get source code and check for implementation
  const sourceCodeUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${verifiedContractAddress}&apikey=${apiKey}`;

  const sourceCodeResponse = await fetch(sourceCodeUrl);
  const sourceCodeData = await sourceCodeResponse.json();

  if (sourceCodeData.status !== "1" || !sourceCodeData.result || sourceCodeData.result.length === 0) {
    console.error("Error fetching source code from Etherscan:", sourceCodeData);
    throw new Error("Failed to fetch source code from Etherscan");
  }

  const contractData = sourceCodeData.result[0];
  const implementation = contractData.Implementation || null;

  // If there's an implementation address, make a second call to get its ABI
  if (implementation && !isZeroAddress(implementation)) {
    const abiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getabi&address=${implementation}&apikey=${apiKey}`;
    const abiResponse = await fetch(abiUrl);
    const abiData = await abiResponse.json();

    if (abiData.status === "1" && abiData.result) {
      return {
        abi: JSON.parse(abiData.result),
        implementation,
      };
    } else {
      console.error("Error fetching ABI for implementation from Etherscan:", abiData);
      throw new Error("Failed to fetch ABI for implementation from Etherscan");
    }
  }

  // If no implementation or failed to get implementation ABI, return original contract ABI
  return {
    abi: JSON.parse(contractData.ABI),
    implementation,
  };
};

export function parseAndCorrectJSON(input: string): any {
  // Add double quotes around keys
  let correctedJSON = input.replace(/(\w+)(?=\s*:)/g, '"$1"');

  // Remove trailing commas
  correctedJSON = correctedJSON.replace(/,(?=\s*[}\]])/g, "");

  try {
    return JSON.parse(correctedJSON);
  } catch (error) {
    console.error("Failed to parse JSON", error);
    throw new Error("Failed to parse JSON");
  }
}

export const getNetworkName = (chains: Chain[], chainId: number) => {
  const chain = chains.find(chain => chain.id === chainId);
  return chain ? chain.name : "Unknown Network";
};
