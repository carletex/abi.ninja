import { useState } from "react";
import { AbiFunction } from "abitype";
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface MethodSelectorProps {
  readMethodsWithInputsAndWriteMethods: (AbiFunction & { uid: string })[];
  abi: (AbiFunction & { uid: string })[];
  onMethodSelect: (uid: string) => void;
  removeMethod: (uid: string) => void;
}

export const MethodSelector = ({
  readMethodsWithInputsAndWriteMethods,
  abi,
  onMethodSelect,
  removeMethod,
}: MethodSelectorProps) => {
  const [isReadCollapsed, setIsReadCollapsed] = useState(false);
  const [isWriteCollapsed, setIsWriteCollapsed] = useState(false);

  const readMethods = readMethodsWithInputsAndWriteMethods.filter(
    method => method.stateMutability === "view" || method.stateMutability === "pure",
  );

  const writeMethods = readMethodsWithInputsAndWriteMethods.filter(
    method => method.stateMutability !== "view" && method.stateMutability !== "pure",
  );

  const isMethodSelected = (uid: string) => {
    return abi.some(method => method.uid === uid);
  };

  return (
    <div className="overflow-auto h-[80vh]">
      <input id="sidebar" type="checkbox" className="drawer-toggle" />
      <label htmlFor="sidebar" className="cursor-pointer block sm:hidden">
        <XMarkIcon className="h-5 w-5 mb-5 hover:opacity-70" />
      </label>
      <div>
        <h3
          className="font-semibold text-lg flex items-center cursor-pointer"
          onClick={() => setIsReadCollapsed(!isReadCollapsed)}
        >
          <span>
            {isReadCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 mr-2" />
            )}
          </span>{" "}
          Read
        </h3>
        {!isReadCollapsed && (
          <div className="flex flex-col items-start gap-1 pb-4">
            {readMethods.map(method => (
              <div key={method.uid} className="flex items-center gap-2 w-full pr-4">
                <button
                  className={`btn btn-sm btn-ghost font-normal pr-1 w-full justify-between ${
                    isMethodSelected(method.uid) ? "bg-purple-100 pointer-events-none" : ""
                  }`}
                  onClick={() => onMethodSelect(method.uid)}
                >
                  {method.name}
                  {isMethodSelected(method.uid) && (
                    <button
                      className="ml-4 text-xs hover:bg-gray-100 rounded-md p-1 pointer-events-auto"
                      onClick={() => removeMethod(method.uid)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3
          className="font-semibold text-lg flex items-center cursor-pointer"
          onClick={() => setIsWriteCollapsed(!isWriteCollapsed)}
        >
          <span>
            {isWriteCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 mr-2" />
            )}
          </span>{" "}
          Write
        </h3>
        {!isWriteCollapsed && (
          <div className="flex flex-col items-start gap-1">
            {writeMethods.map((method, index) => (
              <div key={index} className="flex items-center gap-2 w-full pr-4">
                <button
                  className={`btn btn-sm btn-ghost font-normal pr-1 w-full justify-between ${
                    isMethodSelected(method.name) ? "bg-purple-100 pointer-events-none" : ""
                  }`}
                  onClick={() => onMethodSelect(method.uid)}
                >
                  {method.name}
                  {isMethodSelected(method.name) && (
                    <button
                      className="ml-4 text-xs hover:bg-gray-100 rounded-md p-1 pointer-events-auto"
                      onClick={() => removeMethod(method.uid)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
