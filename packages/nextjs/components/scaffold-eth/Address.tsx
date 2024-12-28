import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Address as AddressType, isAddress } from "viem";
import { hardhat } from "viem/chains";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useEnsData } from "~~/hooks/useEnsData";
import { useGlobalState } from "~~/services/store/store";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

type AddressProps = {
  address?: AddressType;
  disableAddressLink?: boolean;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
};

const blockieSizeMap = {
  xs: 6,
  sm: 7,
  base: 8,
  lg: 9,
  xl: 10,
  "2xl": 12,
  "3xl": 15,
};

/**
 * Displays an address (or ENS) with a Blockie image and option to copy address.
 */
export const Address = ({ address, disableAddressLink, format, size = "base" }: AddressProps) => {
  const [addressCopied, setAddressCopied] = useState(false);
  const targetNetwork = useGlobalState(state => state.targetNetwork);
  const { ens, avatar_url } = useEnsData(address ?? "");

  // Skeleton UI
  if (!address) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAddress(address)) {
    return <span className="text-error">Wrong address</span>;
  }

  const blockExplorerAddressLink = getBlockExplorerAddressLink(targetNetwork, address);
  let displayAddress = address?.slice(0, 5) + "..." + address?.slice(-4);

  if (ens) {
    displayAddress = ens;
  } else if (format === "long") {
    displayAddress = address;
  }

  return (
    <div className="flex items-center flex-shrink-0">
      <div className="flex-shrink-0">
        <BlockieAvatar
          address={address}
          ensImage={avatar_url}
          size={(blockieSizeMap[size] * 24) / blockieSizeMap["base"]}
        />
      </div>
      {disableAddressLink || targetNetwork.id === hardhat.id || !Boolean(blockExplorerAddressLink) ? (
        <span className={`ml-1.5 text-${size} font-normal`}>{displayAddress}</span>
      ) : (
        <a
          className={`ml-1.5 text-${size} font-normal`}
          target="_blank"
          href={blockExplorerAddressLink}
          rel="noopener noreferrer"
        >
          {displayAddress}
        </a>
      )}
      {addressCopied ? (
        <CheckCircleIcon
          className="ml-1.5 text-xl font-normal text-secondary-content h-5 w-5 cursor-pointer"
          aria-hidden="true"
        />
      ) : (
        <CopyToClipboard
          text={address}
          onCopy={() => {
            setAddressCopied(true);
            setTimeout(() => {
              setAddressCopied(false);
            }, 800);
          }}
        >
          <DocumentDuplicateIcon
            className="ml-1.5 text-xl font-normal text-secondary-content h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        </CopyToClipboard>
      )}
    </div>
  );
};
