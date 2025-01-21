import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { Address, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { usePublicClient } from "wagmi";
import { ChevronLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { MiniFooter } from "~~/components/MiniFooter";
import { NetworksDropdown } from "~~/components/NetworksDropdown/NetworksDropdown";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { AddressInput } from "~~/components/scaffold-eth";
import useFetchContractAbi from "~~/hooks/useFetchContractAbi";
import { useHeimdall } from "~~/hooks/useHeimdall";
import { useGlobalState } from "~~/services/store/store";
import { getAbiFromLocalStorage, parseAndCorrectJSON, saveAbiToLocalStorage } from "~~/utils/abi";
import { notification } from "~~/utils/scaffold-eth";

enum TabName {
  verifiedContract,
  addressAbi,
}

const tabValues = Object.values(TabName) as TabName[];

const Home: NextPage = () => {
  const [activeTab, setActiveTab] = useState(TabName.verifiedContract);
  const [network, setNetwork] = useState(mainnet.id.toString());
  const [verifiedContractAddress, setVerifiedContractAddress] = useState("");
  const [localAbiContractAddress, setLocalAbiContractAddress] = useState("");
  const [localContractAbi, setLocalContractAbi] = useState("");

  const router = useRouter();

  const publicClient = usePublicClient({
    chainId: parseInt(network),
  });

  const { setContractAbi, setAbiContractAddress, setImplementationAddress } = useGlobalState(state => ({
    setContractAbi: state.setContractAbi,
    setAbiContractAddress: state.setAbiContractAddress,
    setImplementationAddress: state.setImplementationAddress,
  }));

  const {
    contractData,
    error,
    isLoading: isFetchingAbi,
    implementationAddress,
  } = useFetchContractAbi({ contractAddress: verifiedContractAddress, chainId: parseInt(network) });

  const { abi: heimdallAbi, isLoading: isHeimdallFetching } = useHeimdall({
    contractAddress: localAbiContractAddress as Address,
    rpcUrl: publicClient?.chain.rpcUrls.default.http[0],
    disabled: network === "31337" || !localAbiContractAddress,
  });

  const isAbiAvailable = contractData?.abi && contractData.abi.length > 0;

  const handleFetchError = useCallback(async () => {
    try {
      const bytecode = await publicClient?.getBytecode({
        address: verifiedContractAddress as Address,
      });
      const isContract = Boolean(bytecode) && bytecode !== "0x";

      if (isContract) {
        setLocalAbiContractAddress(verifiedContractAddress);
        setActiveTab(TabName.addressAbi);
      } else {
        notification.error("Address is not a contract, are you sure you are on the correct chain?");
      }
    } catch (error) {
      console.error("Error checking if address is a contract:", error);
      notification.error("Error checking if address is a contract. Please try again.");
    }
  }, [publicClient, verifiedContractAddress, setLocalAbiContractAddress, setActiveTab]);

  useEffect(() => {
    if (implementationAddress) {
      setImplementationAddress(implementationAddress);
    }

    if (contractData?.abi) {
      setContractAbi(contractData.abi);
    }

    if (network === "31337" && isAddress(verifiedContractAddress)) {
      const savedAbi = getAbiFromLocalStorage(verifiedContractAddress);
      if (savedAbi) {
        setContractAbi(savedAbi);
        setAbiContractAddress(verifiedContractAddress);
        router.push(`/${verifiedContractAddress}/${network}`);
        return;
      }
      setActiveTab(TabName.addressAbi);
      setLocalAbiContractAddress(verifiedContractAddress);
      return;
    }

    if (error && isAddress(verifiedContractAddress)) {
      handleFetchError();
    }
  }, [
    contractData,
    error,
    implementationAddress,
    network,
    verifiedContractAddress,
    handleFetchError,
    setContractAbi,
    setImplementationAddress,
    router,
    setAbiContractAddress,
  ]);

  useEffect(() => {
    if (router.pathname === "/") {
      setContractAbi([]);
      setImplementationAddress("");
    }
  }, [router.pathname, setContractAbi, setImplementationAddress]);

  const handleLoadContract = () => {
    if (isAbiAvailable) {
      router.push(`/${verifiedContractAddress}/${network}`);
    }
  };

  const handleUserProvidedAbi = () => {
    if (!localContractAbi) {
      notification.error("Please provide an ABI.");
      return;
    }
    try {
      const parsedAbi = parseAndCorrectJSON(localContractAbi);
      setContractAbi(parsedAbi);
      if (network === "31337") {
        notification.success("Saving ABI to local storage...");
        saveAbiToLocalStorage(localAbiContractAddress, parsedAbi);
      } else {
        notification.success("ABI successfully loaded.");
      }
      router.push(`/${localAbiContractAddress}/${network}`);
    } catch (error) {
      notification.error("Invalid ABI format. Please ensure it is a valid JSON.");
    }
  };

  return (
    <>
      <MetaHeader />
      <div className="flex flex-grow items-center justify-center bg-base-100">
        <div
          className={`flex h-screen bg-base-200 relative overflow-x-hidden w-full flex-col items-center justify-center rounded-2xl pb-4 lg:h-[650px] lg:w-[450px] lg:justify-between lg:shadow-xl`}
        >
          <div className="flex-grow flex flex-col items-center justify-center lg:w-full">
            {tabValues.map(tabValue => (
              <div
                key={tabValue}
                className={`absolute flex flex-col justify-center inset-0 w-full transition-transform duration-300 ease-in-out px-1 ${
                  activeTab === tabValue
                    ? "translate-x-0"
                    : activeTab < tabValue
                    ? "translate-x-full"
                    : "-translate-x-full"
                }`}
              >
                {tabValue === TabName.verifiedContract ? (
                  <div className="my-16 flex flex-col items-center justify-center">
                    <Image src="/logo_inv.svg" alt="logo" width={119} height={87} className="mb-4" />{" "}
                    <h2 className="mb-0 text-5xl font-bold">ABI Ninja</h2>
                    <p>Interact with smart contracts on any EVM chain</p>
                    <div className="mt-4" id="react-select-container">
                      <NetworksDropdown onChange={option => setNetwork(option ? option.value.toString() : "")} />
                    </div>
                    <div className="w-10/12 my-8">
                      <AddressInput
                        placeholder="Contract address"
                        value={verifiedContractAddress}
                        onChange={setVerifiedContractAddress}
                      />
                    </div>
                    <button
                      className="btn btn-primary min-h-fit h-10 px-4 text-base font-semibold border-2 hover:bg-neutral hover:text-primary"
                      onClick={handleLoadContract}
                      disabled={!isAbiAvailable}
                    >
                      {isFetchingAbi ? <span className="loading loading-spinner"></span> : "Load contract"}
                    </button>
                    <div className="flex flex-col text-sm w-4/5 mb-10 mt-14">
                      <div className="mb-2 text-center text-base">Quick access</div>
                      <div className="flex justify-center w-full rounded-xl">
                        <Link
                          href="/0x6B175474E89094C44Da98b954EedeAC495271d0F/1"
                          passHref
                          className="link w-1/3 text-center text-base-content no-underline"
                        >
                          DAI
                        </Link>
                        <Link
                          href="/0xde30da39c46104798bb5aa3fe8b9e0e1f348163f/1"
                          passHref
                          className="link w-1/3 text-center text-base-content no-underline"
                        >
                          Gitcoin
                        </Link>
                        <Link
                          href="/0x00000000006c3852cbef3e08e8df289169ede581/1"
                          passHref
                          className="link w-1/3 text-center text-base-content no-underline"
                        >
                          Opensea
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center gap-3 p-6">
                    <div className="flex justify-center mb-6">
                      <button
                        className="btn btn-ghost absolute left-4 px-2 btn-primary"
                        onClick={() => {
                          setActiveTab(TabName.verifiedContract);
                          setVerifiedContractAddress("");
                        }}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Go back
                      </button>
                      <Image src="/logo_inv.svg" alt="logo" width={64} height={64} className="mb-2" />
                    </div>

                    <div className="flex flex-col items-center w-4/5 border-b-2 pb-8">
                      <div className="flex justify-center items-center gap-1">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                        <h1 className="font-semibold text-lg mb-0">Contract not verified</h1>
                      </div>
                      <p className="bg-neutral px-2 rounded-md  text-sm shadow-sm">{localAbiContractAddress}</p>
                      <h4 className="text-center mb-6 font-semibold leading-tight">
                        You can decompile the contract (beta) or import the ABI manually below.
                      </h4>
                      <button
                        className="btn btn-primary min-h-fit h-10 px-4 text-base font-semibold border-2 hover:bg-neutral hover:text-primary"
                        onClick={async () => {
                          if (heimdallAbi) {
                            setContractAbi(heimdallAbi);
                            setAbiContractAddress(localAbiContractAddress as Address);
                            router.push(`/${localAbiContractAddress}/${network}`);
                          }
                        }}
                        disabled={network === "31337" || isHeimdallFetching}
                      >
                        {isHeimdallFetching ? (
                          <div className="flex items-center gap-2">
                            <span className="loading loading-spinner loading-xs"></span>
                            <span>Decompiling contract...</span>
                          </div>
                        ) : (
                          "Decompile (beta)"
                        )}
                      </button>
                    </div>
                    <div className="w-full flex flex-col items-center gap-2">
                      <h1 className="mt-2 font-semibold text-lg">Manually import ABI</h1>
                      <textarea
                        className="textarea bg-neutral w-4/5 h-24 mb-4 resize-none"
                        placeholder="Paste contract ABI in JSON format here"
                        value={localContractAbi}
                        onChange={e => setLocalContractAbi(e.target.value)}
                      ></textarea>
                      <button
                        className="btn btn-primary min-h-fit h-10 px-4 mb-2 text-base font-semibold border-2 hover:bg-neutral hover:text-primary"
                        onClick={handleUserProvidedAbi}
                      >
                        Import ABI
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <SwitchTheme className="absolute top-5 right-5" />
          <MiniFooter />
        </div>
      </div>
    </>
  );
};

export default Home;
