import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { Abi, isAddress } from "viem";
import { Footer } from "~~/components/Footer";
import { MiniHeader } from "~~/components/MiniHeader";
import { ContractUI } from "~~/components/scaffold-eth";
import { fetchContractABIFromEtherscan } from "~~/utils/abi";

interface ParsedQueryContractDetailsPage extends ParsedUrlQuery {
  contractAddress: string;
  network: string;
}

type ContractData = {
  abi: Abi;
  address: string;
};

const ContractDetailPage = () => {
  const router = useRouter();
  const { contractAddress } = router.query as ParsedQueryContractDetailsPage;
  const [contractData, setContractData] = useState<ContractData>({ abi: [], address: contractAddress });
  const contractName = contractData.address;

  useEffect(() => {
    const fetchContractAbi = async () => {
      try {
        const abi = await fetchContractABIFromEtherscan(contractAddress);
        setContractData({ abi: JSON.parse(abi), address: contractAddress });
      } catch (e) {
        console.error("Error while getting abi: ", e);
      }
    };

    if (isAddress(contractAddress)) {
      fetchContractAbi();
    }
  }, [contractAddress]);

  return (
    <div className="bg-base-100 min-h-screen">
      <MiniHeader />
      <div className="flex flex-col gap-y-6 lg:gap-y-8 justify-center items-center">
        {contractData.abi?.length > 0 ? (
          <ContractUI key={contractName} deployedContractData={contractData} />
        ) : (
          <h1 className="text-2xl">Contract not found</h1>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ContractDetailPage;
