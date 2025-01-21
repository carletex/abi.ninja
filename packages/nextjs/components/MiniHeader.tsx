import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bars3Icon, Cog6ToothIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { getAbiFromLocalStorage, removeAbiFromLocalStorage, saveAbiToLocalStorage } from "~~/utils/abi";
import { parseAndCorrectJSON } from "~~/utils/abi";
import { notification } from "~~/utils/scaffold-eth";

export const MiniHeader = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [editedAbi, setEditedAbi] = useState("");
  const { contractAddress, setContractAbi } = useGlobalState(state => ({
    contractAddress: state.abiContractAddress,
    setContractAbi: state.setContractAbi,
  }));

  const savedAbi = getAbiFromLocalStorage(contractAddress);
  const formattedAbi = savedAbi ? JSON.stringify(savedAbi, null, 2) : "";

  useEffect(() => {
    setEditedAbi(formattedAbi);
  }, [formattedAbi, contractAddress]);

  const handleRemoveSavedAbi = () => {
    removeAbiFromLocalStorage(contractAddress);
    setContractAbi([]);
    setShowSuccess(true);
  };

  const handleSaveEdit = () => {
    try {
      const parsedAbi = parseAndCorrectJSON(editedAbi);
      if (parsedAbi) {
        saveAbiToLocalStorage(contractAddress, parsedAbi);
        setContractAbi(parsedAbi);
        notification.success("ABI updated successfully!");
      }
    } catch (error) {
      notification.error("Invalid ABI format. Please ensure it is valid JSON.");
    }
  };

  const handleResetAbi = () => {
    setEditedAbi(formattedAbi);
  };

  return (
    <div className="sticky lg:static top-0 navbar bg-base-200 border-b border-secondary min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <label htmlFor="sidebar" className="btn btn-ghost drawer-button sm:hidden ml-2">
          <Bars3Icon className="h-1/2" />
        </label>
        <Link href="/" passHref className="flex items-center gap-2 sm:ml-4 mr-6 shrink-0">
          <div className="flex items-center">
            <Image alt="Abi Ninja logo" src="/logo_inv.svg" width={50} height={50} />
            <span className="hidden sm:flex ml-2">
              <strong>ABI</strong> <span>Ninja</span>
            </span>
          </div>
        </Link>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <button
          className="mr-4 hover:transition-all hover:scale-110"
          onClick={() => {
            const modal = document.getElementById("configuration-modal") as HTMLDialogElement;
            modal?.showModal();
          }}
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
        <dialog id="configuration-modal" className="modal">
          <div className="modal-box max-w-2xl bg-base-200 p-0">
            <div className="flex justify-between items-center p-4 border-b border-base-300">
              <h3 className="font-bold text-xl">Configuration</h3>
              <form method="dialog">
                <button className="mr-1 hover:transition-all hover:scale-110 hover:text-error">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </form>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Local Storage</h2>
                <div className="space-y-3">
                  <p>
                    🥷abi.ninja automatically saves the contract ABI to your browser&apos;s local storage when you first
                    interact with a contract on local networks (like Anvil or Hardhat). This speeds up future
                    interactions with the same contract. You can modify or remove the saved ABI below.
                  </p>
                </div>
              </div>

              {savedAbi && (
                <div className="space-y-4">
                  <h3 className="text-md font-semibold">Saved ABI for {contractAddress}</h3>
                  <div className="space-y-4">
                    <textarea
                      className="textarea textarea-bordered bg-base-300 w-full h-96 font-mono text-sm"
                      value={editedAbi}
                      onChange={e => setEditedAbi(e.target.value)}
                      spellCheck="false"
                    />
                    <div className="flex justify-between items-center">
                      <button className="btn btn-sm btn-ghost gap-2" onClick={handleResetAbi}>
                        Reset Changes
                      </button>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-error gap-2"
                          onClick={handleRemoveSavedAbi}
                          title="Remove saved ABI"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Remove ABI
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={handleSaveEdit}>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showSuccess && (
                <div className="alert alert-success">
                  <span>ABI removed successfully! Please reload the page to see the changes.</span>
                </div>
              )}
            </div>
          </div>
        </dialog>
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
