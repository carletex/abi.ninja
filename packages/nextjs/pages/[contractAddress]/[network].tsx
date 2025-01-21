import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { ParsedUrlQuery } from "querystring";
import { Abi, Address, isAddress } from "viem";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { MiniHeader } from "~~/components/MiniHeader";
import { formDataToChain, storeChainInLocalStorage } from "~~/components/NetworksDropdown/utils";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { ContractUI } from "~~/components/scaffold-eth";
import useFetchContractAbi from "~~/hooks/useFetchContractAbi";
import { useGlobalState } from "~~/services/store/store";
import { getAbiFromLocalStorage, getNetworkName, parseAndCorrectJSON, saveAbiToLocalStorage } from "~~/utils/abi";
import { notification } from "~~/utils/scaffold-eth";

interface ParsedQueryContractDetailsPage extends ParsedUrlQuery {
  contractAddress: Address;
  network: string;
}

type ContractData = {
  abi: Abi;
  address: Address;
};

type ServerSideProps = {
  addressFromUrl: Address | null;
  chainIdFromUrl: number | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const contractAddress = context.params?.contractAddress as Address | undefined;
  const network = context.params?.network as string | undefined;

  const formattedAddress = contractAddress && isAddress(contractAddress) ? contractAddress : null;
  const formattedChainId = network ? parseInt(network, 10) : null;

  return {
    props: {
      addressFromUrl: formattedAddress,
      chainIdFromUrl: formattedChainId,
    },
  };
};

const ContractDetailPage = ({ addressFromUrl, chainIdFromUrl }: ServerSideProps) => {
  const router = useRouter();
  const { contractAddress, network } = router.query as ParsedQueryContractDetailsPage;
  const [localContractAbi, setLocalContractAbi] = useState<string>("");
  const [isUseLocalAbi, setIsUseLocalAbi] = useState(false);
  const [localContractData, setLocalContractData] = useState<ContractData | null>(null);
  const [isLoadingLocalStorage, setIsLoadingLocalStorage] = useState(true);

  const {
    chainId,
    setAbiContractAddress,
    setImplementationAddress,
    contractAbi,
    chains,
    addChain,
    setTargetNetwork,
    setContractAbi,
  } = useGlobalState(state => ({
    chains: state.chains,
    addChain: state.addChain,
    chainId: state.targetNetwork.id,
    setAbiContractAddress: state.setAbiContractAddress,
    setTargetNetwork: state.setTargetNetwork,
    setImplementationAddress: state.setImplementationAddress,
    contractAbi: state.contractAbi,
    setContractAbi: state.setContractAbi,
  }));

  const {
    contractData: fetchedContractData,
    error: fetchError,
    isLoading,
    implementationAddress,
  } = useFetchContractAbi({
    contractAddress,
    chainId: parseInt(network),
    disabled: contractAbi.length > 0,
  });

  useEffect(() => {
    const savedAbi = getAbiFromLocalStorage(contractAddress);
    if (savedAbi) {
      setLocalContractData({ abi: savedAbi, address: contractAddress });
      setAbiContractAddress(contractAddress);
      setIsUseLocalAbi(true);
    }
    setIsLoadingLocalStorage(false);

    if (!isLoadingLocalStorage && savedAbi) {
      notification.success("Loaded ABI from local storage. Click the gear icon to manage ABIs.");
    }
  }, [contractAddress, isLoadingLocalStorage, setAbiContractAddress]);

  const effectiveContractData =
    contractAbi.length > 0
      ? { abi: contractAbi, address: contractAddress }
      : isUseLocalAbi && localContractData
      ? localContractData
      : fetchedContractData;

  const error = isUseLocalAbi || isLoadingLocalStorage ? null : fetchError;

  useEffect(() => {
    if (network) {
      const chain = Object.values(chains).find(chain => chain.id === parseInt(network));
      if (chain) {
        setTargetNetwork(chain);
      }
    }

    if (implementationAddress) {
      setImplementationAddress(implementationAddress);
    }
  }, [network, implementationAddress, chains, setTargetNetwork, setImplementationAddress]);

  const handleUserProvidedAbi = () => {
    try {
      const parsedAbi = parseAndCorrectJSON(localContractAbi);
      if (parsedAbi) {
        setIsUseLocalAbi(true);
        saveAbiToLocalStorage(contractAddress, parsedAbi);
        setLocalContractData({ abi: parsedAbi, address: contractAddress });
        setAbiContractAddress(contractAddress);
        setContractAbi(parsedAbi);
      } else {
        throw new Error("Parsed ABI is null or undefined");
      }
    } catch (error) {
      console.error("Error parsing ABI:", error);
      setIsUseLocalAbi(false);
      notification.error("Invalid ABI format. Please ensure it is a valid JSON.");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const chain = formDataToChain(formData);

    addChain(chain);
    e.currentTarget.reset();
    handleUserProvidedAbi();

    storeChainInLocalStorage(chain);
    notification.success("Custom chain successfully loaded.");
  };

  return (
    <>
      <MetaHeader address={addressFromUrl} network={chainIdFromUrl} />
      <div className="bg-base-100 h-screen flex flex-col">
        <MiniHeader />
        <div className="flex flex-col gap-y-6 lg:gap-y-8 flex-grow h-full overflow-hidden">
          {isLoading || isLoadingLocalStorage ? (
            <div className="flex justify-center h-full mt-14">
              <span className="loading loading-spinner text-primary h-14 w-14"></span>
            </div>
          ) : effectiveContractData && effectiveContractData?.abi?.length > 0 ? (
            <ContractUI key={contractAddress} initialContractData={effectiveContractData} />
          ) : (
            <div className="bg-base-200 flex flex-col border shadow-xl rounded-2xl px-6 lg:px-8 m-4 overflow-auto">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="text-red-500 mt-4 h-20 w-20 pr-4" />
                <div>
                  <h2 className="text-2xl pt-2 flex items-end">{error?.message}</h2>
                  <p className="break-all">
                    There was an error loading the contract <strong>{contractAddress}</strong> on{" "}
                    <strong>{getNetworkName(chains, chainId)}</strong>.
                  </p>
                  <p className="pb-2">
                    Make sure the data is correct and you are connected to the right network. Or add the chain/ABI
                    below.
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-12">
                {chains.some(chain => chain.id === chainId) ? (
                  <div className="w-1/2">
                    <form
                      className="bg-base-200"
                      onSubmit={e => {
                        e.preventDefault();
                        handleUserProvidedAbi();
                      }}
                    >
                      <h3 className="font-bold text-xl">Add Custom ABI</h3>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">ABI</span>
                        </label>
                        <textarea
                          className="textarea bg-neutral w-full h-full mb-4 resize-none"
                          placeholder="Paste contract ABI in JSON format here"
                          value={localContractAbi}
                          onChange={e => setLocalContractAbi(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="modal-action mt-6">
                        <button type="submit" className="btn btn-primary">
                          Submit ABI
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="w-1/2">
                    <form className="bg-base-200" onSubmit={handleSubmit}>
                      <h3 className="font-bold text-xl">Add Custom Chain and ABI</h3>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Chain ID</span>
                        </label>
                        <input type="number" name="id" className="input input-bordered bg-neutral" required />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Name</span>
                        </label>
                        <input type="text" name="name" className="input input-bordered bg-neutral" required />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Native Currency Name</span>
                        </label>
                        <input
                          type="text"
                          name="nativeCurrencyName"
                          className="input input-bordered bg-neutral"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Native Currency Symbol</span>
                        </label>
                        <input
                          type="text"
                          name="nativeCurrencySymbol"
                          className="input input-bordered bg-neutral"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Native Currency Decimals</span>
                        </label>
                        <input
                          type="number"
                          name="nativeCurrencyDecimals"
                          className="input input-bordered bg-neutral"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">RPC URL</span>
                        </label>
                        <input type="text" name="rpcUrl" className="input input-bordered bg-neutral" required />
                      </div>
                      <div className="form-control flex-row mt-4 items-center gap-4">
                        <label className="label">
                          <span className="label-text">Is Testnet?</span>
                        </label>
                        <input type="checkbox" name="testnet" className="checkbox" />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">ABI</span>
                        </label>
                        <textarea
                          className="textarea bg-neutral w-full h-full mb-4 resize-none"
                          placeholder="Paste contract ABI in JSON format here"
                          value={localContractAbi}
                          onChange={e => setLocalContractAbi(e.target.value)}
                          required
                        ></textarea>
                      </div>
                      <div className="modal-action mt-6">
                        <button type="submit" className="btn btn-primary">
                          Submit Chain and Import ABI
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              <button className="btn btn-ghost text-center self-end p-2 text-base border-2 mb-4">
                <Link href="/">Go back to homepage</Link>
              </button>
            </div>
          )}
        </div>
      </div>
      <SwitchTheme className="fixed bottom-3 right-6 z-50" />
    </>
  );
};

export default ContractDetailPage;
