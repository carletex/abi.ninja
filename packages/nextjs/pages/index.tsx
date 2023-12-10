import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { HeartIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";

const Home: NextPage = () => {
  const [activeTab, setActiveTab] = useState("verifiedContract");
  const [network, setNetwork] = useState("mainnet");

  return (
    <>
      <MetaHeader />
      <div className="flex flex-grow items-center justify-center bg-base-100">
        <div className="flex h-screen w-full flex-col items-center justify-center rounded-2xl bg-white p-2 lg:h-[650px] lg:w-[450px] lg:justify-between lg:shadow-xl">
          <div className="mt-10 flex w-7/12 flex-col items-center justify-center lg:w-10/12">
            <Image src="/logo_inv.svg" alt="logo" width={128} height={128} className="mb-4" />
            <h2 className="mb-0 text-5xl font-bold">ABI Ninja</h2>
            <p className="">Interact with any contract on Ethereum</p>
            <div className="my-4">
              <select
                className="select select-sm w-36 max-w-xs bg-slate-50"
                value={network}
                onChange={e => setNetwork(e.target.value)}
              >
                <option value="localhost">Localhost</option>
                <option value="mainnet">Mainnet</option>
                <option value="optimism">Optimism</option>
              </select>
            </div>

            <div role="tablist" className="tabs tabs-bordered w-full">
              <a
                role="tab"
                className={`tab ${activeTab === "verifiedContract" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("verifiedContract")}
              >
                Verified Contract
              </a>
              <a
                role="tab"
                className={`tab ${activeTab === "addressAbi" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("addressAbi")}
              >
                Address + ABI
              </a>
            </div>

            <div className="min-h-[150px] w-full">
              {activeTab === "verifiedContract" && (
                <div className="my-4">
                  <input
                    type="text"
                    placeholder="Verified contract address"
                    className="input h-9 w-full bg-slate-100"
                  />
                  <div className="flex flex-col text-sm">
                    <div className="mb-2 mt-4 text-center font-semibold">Quick Access</div>
                    <div className="flex justify-around">
                      <Link
                        href="/placeholder"
                        passHref
                        className="link w-1/3 text-center text-purple-700 no-underline"
                      >
                        DAI
                      </Link>
                      <Link
                        href="/placeholder"
                        passHref
                        className="link w-1/3 text-center text-purple-700 no-underline"
                      >
                        Gitcoin
                      </Link>
                      <Link
                        href="/placeholder"
                        passHref
                        className="link w-1/3 text-center text-purple-700 no-underline"
                      >
                        Opensea
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "addressAbi" && (
                <div className="my-4 flex w-full flex-col gap-3">
                  <input type="text" placeholder="Contract address" className="input h-9 w-full bg-slate-100" />
                  <input placeholder="Contract ABI(json format)" className="input h-9 w-full bg-slate-100" />
                </div>
              )}
            </div>
            <button className="btn btn-primary w-1/2">Load Contract</button>
          </div>
          <div className="mt-10">
            <ul className="menu menu-horizontal w-full">
              <div className="flex w-full items-center justify-center gap-2 text-xs">
                <div className="text-center">
                  <a href="https://github.com/scaffold-eth/se-2" target="_blank" rel="noreferrer" className="link">
                    Fork me
                  </a>
                </div>
                <span>·</span>
                <div className="flex items-center justify-center gap-2">
                  <p className="m-0 text-center">
                    Built with <HeartIcon className="inline-block h-4 w-4" /> at
                  </p>
                  <a
                    className="flex items-center justify-center gap-1"
                    href="https://buidlguidl.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BuidlGuidlLogo className="h-5 w-3 pb-1" />
                    <span className="link">BuidlGuidl</span>
                  </a>
                </div>
                <span>·</span>
                <div className="text-center">
                  <a
                    href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA"
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    Support
                  </a>
                </div>
              </div>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
