import { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";
import { EIP6963AnnounceProvider, EIP6963RequestProvider } from "../constants";
export const useWalletConnection = () => {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [browserProvider, setBrowserProvider] = useState(null);
  const [provider, setProvider] = useState(null);
  // ADDED: Refreshing state
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ADDED: Supported chains
  const supportedChains = useMemo(
    () => [
      {
        chainId: 1,
        name: "Ethereum Mainnet",
        symbol: "ETH",
      },
      {
        chainId: 11155111,
        name: "Sepolia Testnet",
        symbol: "ETH",
      },
      {
        chainId: 137,
        name: "Polygon",
        symbol: "POL",
      },
      {
        chainId: 80002,
        name: "Polygon Amoy",
        symbol: "POL",
      },
      {
        chainId: 10,
        name: "Optimism",
        symbol: "ETH",
      },
      {
        chainId: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
      },
      {
        chainId: 8453,
        name: "Base",
        symbol: "ETH",
      },
      {
        chainId: 84532,
        name: "Base Sepolia",
        symbol: "ETH",
      },
    ],
    []
  );
  const setAccountAndSigner = useCallback(
    async (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setAccount(newAccount);
        const signer = await browserProvider.getSigner(newAccount);
        setSigner(signer);
      } else {
        setAccount(null);
        setSigner(null);
        setBalance(null);
      }
    },
    [browserProvider]
  );
  const connectWallet = useCallback(async () => {
    if (!browserProvider) {
      throw new Error("No wallet provider detected.");
    }
    const accounts = await browserProvider.send("eth_requestAccounts", []);
    await setAccountAndSigner(accounts);
    const network = await browserProvider.getNetwork();
    setChainId(Number(network.chainId));
  }, [browserProvider, setAccountAndSigner]);
  const disconnectWallet = useCallback(async () => {
    try {
      if (provider) {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.error("Failed to revoke wallet permission:", error);
    }
    setAccount(null);
    setSigner(null);
    setChainId(null);
    setBalance(null);
  }, [provider]);
  const handleAccountsChanged = useCallback(
    async (accounts) => {
      await setAccountAndSigner(accounts);
      if (accounts.length == 0) {
        setChainId(null);
        setBalance(null);
      }
    },
    [setAccountAndSigner]
  );
  const handleChainChanged = useCallback((newChainId) => {
    setChainId(parseInt(newChainId, 16));
    setBalance(null);
  }, []);
  const handleDisconnect = useCallback(
    async (error) => {
      console.error("Wallet disocnnected with error: ", error);
      await disconnectWallet();
      console.log("handle disconnect successful...");
    },
    [disconnectWallet]
  );
  const getBalance = useCallback(async () => {
    if (browserProvider && account) {
      const balance = await browserProvider.getBalance(account);
      console.log("Balance: ", balance);
      setBalance(formatEther(balance));
    }
  }, [browserProvider, account]);
  // ADDED: Manual refresh balance function
  const refreshBalance = useCallback(async () => {
    if (!browserProvider || !account) {
      return;
    }
    try {
      setIsRefreshing(true);
      const updatedBalance = await browserProvider.getBalance(account);
      console.log("Updated Balance: ", updatedBalance);
      setBalance(formatEther(updatedBalance));
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [browserProvider, account]);
  useEffect(() => {
    const init = async () => {
      const accounts = await browserProvider.send("eth_accounts", []);
      if (accounts.length == 0) {
        return;
      }
      await setAccountAndSigner(accounts);
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));
    };
    if (!browserProvider) {
      console.log("browserProvider is not set....");
      return;
    }
    init();
  }, [browserProvider, setAccountAndSigner]);
  useEffect(() => {
    if (!provider) {
      return;
    }
    provider.on("chainChanged", handleChainChanged);
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("disconnect", handleDisconnect);
    return () => {
      provider.removeListener("chainChanged", handleChainChanged);
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("disconnect", handleDisconnect);
    };
  }, [provider, handleAccountsChanged, handleChainChanged, handleDisconnect]);
  useEffect(() => {
    if (!account || !browserProvider) {
      return;
    }
    getBalance();
  }, [account, browserProvider, getBalance]);
  useEffect(() => {
    const handleProviderAnnouncement = (event) => {
      if (event.detail.info.rdns === "io.metamask") {
        const injectedProvider = event.detail.provider;
        setProvider(injectedProvider);
        setBrowserProvider(new BrowserProvider(injectedProvider));
      }
    };
    window.addEventListener(
      EIP6963AnnounceProvider,
      handleProviderAnnouncement
    );
    window.dispatchEvent(new Event(EIP6963RequestProvider));
    return () => {
      window.removeEventListener(
        EIP6963AnnounceProvider,
        handleProviderAnnouncement
      );
    };
  }, []);
  return {
    account,
    provider,
    browserProvider,
    signer,
    balance,
    chainId,
    connectWallet,
    disconnectWallet,
    getBalance,
    refreshBalance,
    isRefreshing,
    supportedChains,
  };
};
