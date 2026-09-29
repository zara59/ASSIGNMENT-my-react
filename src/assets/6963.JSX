import { useEffect, useState } from "react";

const supportedChains = {
  1: {
    name: "Ethereum Mainnet",
    chainId: "0x1",
  },

  11155111: {
    name: "Sepolia",
    chainId: "0xaa36a7",
  },
};

const Eip6963 = () => {
  const [providers, setProviders] = useState([]);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);

  const [connectedProvider, setConnectedProvider] = useState(null);
  const [error, setError] = useState("");
  const [isUnsupportedChain, setIsUnsupportedChain] = useState(false);

  // Discover wallets using EIP-6963
  useEffect(() => {
    const requestEvent = new Event("eip6963:requestProvider");

    const handleAnnounceProvider = (event) => {
      console.log("Provider:", event.detail);

      setProviders((providers) => {
        const providerExists = providers.some(
          (item) => item.info.uuid === event.detail.info.uuid
        );

        if (providerExists) {
          return providers;
        }

        return [...providers, event.detail];
      });
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnounceProvider
    );

    window.dispatchEvent(requestEvent);

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider
      );
    };
  }, []);

  // Runs when the user changes accounts
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount("");
    } else {
      setAccount(accounts[0]);
    }
  };

  // Runs when the user changes chains
  const handleChainChanged = (chainId) => {
    const numericChainId = parseInt(chainId, 16);

    setChainId(numericChainId);

    if (!supportedChains[numericChainId]) {
      setIsUnsupportedChain(true);
      setError(`Unsupported chain: ${numericChainId}`);
    } else {
      setIsUnsupportedChain(false);
      setError("");
    }
  };

  // Connect wallet
  const handleConnectWallet = async (provider) => {
    console.log("Connecting:", provider);

    try {
      if (!provider) {
        return;
      }

      setConnectedProvider(provider);
      setError("");

      // Request wallet account
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);

      // Get current chain
      const chainId = await provider.request({
        method: "eth_chainId",
      });

      const numericChainId = parseInt(chainId, 16);

      setChainId(numericChainId);

      // Check whether chain is supported
      if (!supportedChains[numericChainId]) {
        setIsUnsupportedChain(true);
        setError(`Unsupported chain: ${numericChainId}`);
      } else {
        setIsUnsupportedChain(false);
      }

      // Listen for account changes
      provider.on("accountsChanged", handleAccountsChanged);

      // Listen for chain changes
      provider.on("chainChanged", handleChainChanged);
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // Switch wallet back to Sepolia
  const switchToSupportedChain = async () => {
    if (!connectedProvider) {
      return;
    }

    try {
      await connectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
          },
        ],
      });
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // Disconnect the wallet from our application's state
  const disconnectWallet = () => {
    if (connectedProvider) {
      connectedProvider.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      connectedProvider.removeListener(
        "chainChanged",
        handleChainChanged
      );
    }

    setAccount("");
    setChainId(0);
    setConnectedProvider(null);
    setIsUnsupportedChain(false);
    setError("");
  };

  return (
    <div>
      <h1>Wallet Connection</h1>

      {/* Wallets discovered through EIP-6963 */}
      <h2>Available Wallets</h2>

      {providers.map((provider) => (
        <div
          key={provider.info.uuid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <img
            src={provider.info.icon}
            alt={provider.info.name}
            width={50}
            height={50}
          />

          <p>{provider.info.name}</p>

          <button
            onClick={() => handleConnectWallet(provider.provider)}
          >
            Connect {provider.info.name}
          </button>
        </div>
      ))}

      {/* Error message */}
      {error && (
        <div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Connected wallet information */}
      {account && (
        <div>
          <h2>Connected</h2>

          <p>
            <strong>Account:</strong> {account}
          </p>

          <p>
            <strong>Chain:</strong>{" "}
            {supportedChains[chainId]
              ? supportedChains[chainId].name
              : "Unsupported Chain"}
          </p>

          <p>
            <strong>Chain ID:</strong> {chainId}
          </p>

          <button onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}

      {/* Unsupported chain warning */}
      {isUnsupportedChain && (
        <div>
          <h3>⚠️ Unsupported Network</h3>

          <p>
            The current network is not supported by this application.
          </p>

          <p>
            Please switch back to Sepolia.
          </p>

          <button onClick={switchToSupportedChain}>
            Switch to Sepolia
          </button>
        </div>
      )}
    </div>
  );
};

export default Eip6963;
