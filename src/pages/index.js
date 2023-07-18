import { Inter } from 'next/font/google';
import { FaArrowsRotate, FaPlus } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dexContract from '@/ethereum/dex';
import { getAmountOfTokensRecievedFromSwap, swapTokens } from '@/ethereum/swap';
import { getEtherBalance, getReserveOfXToken } from '@/ethereum/amounts';
import { addLiquidity } from '@/ethereum/addLiquidity';
import { getTokensAfterRemove } from '@/ethereum/removeLiquidity';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  //  CURRENT ISSUE, WELL NOTHING BUT TEST THE AUTO GENERATE AMOUNT TO RECIEVE, BUT NEED LIQUIDITY FOR THAT FIRST...

  const [swap, setSwap] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [signer, setSigner] = useState();
  const [dContract, setDContract] = useState();
  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const zero = 0n;
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [ethSelected, setEthSelected] = useState(true);

  const [addEther, setAddEther] = useState(zero);
  const [addXTokens, setAddXTokens] = useState(zero);

  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  const [removeMessage, setRemoveMessage] = useState("");

  const [onXChange, setOnXChange] = useState(true);

  const _swapTokens = async () => {
    try {
      const swapAmountWei = ethers.parseEther(fromAmount);
      if (!swapAmountWei == zero) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(signer, swapAmountWei, ethers.parseEther(toAmount), ethSelected);
        setLoading(false);
        setFromAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading
      setFromAmount("");
    }
  }

  const getNTknsReceived = async (swapAmount) => {
    try {
      const swapAmountWei = ethers.parseEther(swapAmount.toString());
      if (!swapAmountWei == zero) {
        const provider = await getProviderOrSigner();
        const ethBalance = await getEtherBalance(provider, "0x2c347FcB2CBd48D000885bc1422fb3b9a9caf32b");
        const amount = await getAmountOfTokensRecievedFromSwap(swapAmountWei, provider, ethSelected, ethBalance, getReserveOfXToken(provider));
        console.log(ethers.formatEther(amount));
        setToAmount(ethers.formatEther(amount));
      } else {
        setToAmount(zero);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const _addLiquidity = async () => {
    try {
      const addEtherWei = ethers.parseEther(addEther.toString());
      if ((!addXTokens == zero) && (!addEtherWei == zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(signer, addXTokens, addEtherWei);
        setLoading(false);
        setAddXTokens(zero);
      } else {
        setAddXTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddXTokens(zero);
    }
  }

  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const removeLpTokensWei = ethers.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLpTokensWei);
      setLoading(false);
      setRemoveXTK(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveXTK(zero);
      setRemoveEther(zero);
    }
  }

  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokenWei = ethers.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, "0x2c347FcB2CBd48D000885bc1422fb3b9a9caf32b");
      const xTokenReserve = await getReserveOfXToken(provider);
      const { _removeEther, _removeXTK } = await getTokensAfterRemove(provider, removeLPTokenWei, _ethBalance, xTokenReserve);
      setRemoveMessage("You will get " + ethers.formatEther(_removeEther || zero) + " ETH and " + ethers.formatEther(_removeXTK) + " XTK");
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const { chainId } = await provider.getNetwork();
    if (chainId != 11155111) {
      window.alert("Please cahnge the network to sepolia");
      throw new Error("Chamge network to sepolia");
    }
    if (needSigner) {
      return provider.getSigner();
    }
    return provider;
  }

  useEffect(() => {
    getCurrentWalletConnected();
    addWalletListener();
  }, [walletAddress]);

  const connectWallet = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        setSigner(await provider.getSigner());
        setDContract(dexContract(provider));
        setWalletAddress(accounts[0]);

        console.log(walletAddress);
      }
      catch (err) {
        console.log(err.message);
      }
    } else {
      console.log("Please install metamask");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          setSigner(await provider.getSigner());
          setDContract(dexContract(provider));
          setWalletAddress(accounts[0]);
          console.log(walletAddress);
        } else {
          console.log("Connect to metamask using connect button");
        }
      }
      catch (err) {
        console.log(err.message);
      }
    }
    else {
      console.log("Please install metamask");
    }
  };

  const addWalletListener = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0]);
        console.log(walletAddress);
      });
    } else {
      setWalletAddress("");
      console.log("Please install metamask");
    }
  };

  useEffect(() => {
    if (swap == 1) {
      const temp = document.getElementById("fromTicker").innerHTML;
      document.getElementById("fromTicker").innerHTML = document.getElementById("toTicker").innerHTML;
      document.getElementById("toTicker").innerHTML = temp;
      setEthSelected(temp == "XTK");
      document.getElementById("from").value = "";
      setToAmount("");
    }
    setSwap(0);
  })

  if (onXChange) {
    return (
      <main
        className={`${inter.className}`}
      >
        <nav className='py-8 mb-12 flex justify-between px-10 shadow-white border-2 border-emerald-300 border-t-0 border-x-0 shadow-md rounded-md'>
          <button onClick={() => setOnXChange(true)}>
            <h1 className='text-md sm:text-xl font-bold text-white text-shadow shadow-emerald-300'>XChange</h1>
          </button>
          <ul className='flex items-center'>
            <li className='text-md sm:text-2xl'>
              <button onClick={() => setOnXChange(false)}>
                <h1 className='text-md sm:text-xl font-bold text-white text-shadow shadow-red-300'>Liquidity Pool</h1>
              </button>
            </li>
          </ul>
        </nav>
        <div className="grid place-items-center">
          <div className="justify-center text-center rounded-lg bg-neutral p-6 shadow-md shadow-white border-emerald-300 border-2 w-1/3 xl:w-1/4">
            <h5
              class="mb-2 text-3xl font-bold leading-tight text-neutral-800 dark:text-neutral-50">
              Swap
            </h5>
            <div class="block my-5">
              <label id="fromTicker" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                ETH
              </label>
              <input
                class="bg-emerald-50 border-2 border-emerald-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-emerald-500 dark:focus:border-emerald-500"
                placeholder=" "
                id="from"
                onChange={async (e) => {
                  setFromAmount(e.target.value || "");
                  await getNTknsReceived(e.target.value || "0");
                }}
              />
            </div>
            <div className="">
              <button onClick={() => { setSwap(1) }}>
                <FaArrowsRotate />
              </button>
            </div>
            <div class="block my-5">
              <label id="toTicker" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                XTK
              </label>
              <input
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
                id="to"
                value={toAmount}
                disabled={true}
              />
            </div>
            <button
              type="button"
              class="inline-block rounded bg-primary px-5 py-2 text-xs font-medium leading-normal text-white border-2 border-white hover:opacity-90 hover:border-emerald-300"
              data-te-ripple-init
              data-te-ripple-color="light"
              onClick={_swapTokens}>
              SWAP
            </button>
          </div>
          <div className="max-w-sm mx-auto mt-10 p-4 border border-gray-200 rounded-lg shadow sm:p-6 bg-gray-800 justify-center">
          <h5 className="mb-3 font-semibold text-sm text-white">
            {walletAddress}
          </h5>
          <ul className="my-4 space-y-3 text-left">
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white hover:cursor-pointer" onClick={connectWallet}>
                <svg aria-hidden="true" className="h-4" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.0728 0L21.9092 12.6999L25.1009 5.21543L39.0728 0Z" fill="#E17726" /><path d="M0.966797 0.0151367L14.9013 5.21656L17.932 12.7992L0.966797 0.0151367Z" fill="#E27625" /><path d="M32.1656 27.0093L39.7516 27.1537L37.1004 36.1603L27.8438 33.6116L32.1656 27.0093Z" fill="#E27625" /><path d="M7.83409 27.0093L12.1399 33.6116L2.89876 36.1604L0.263672 27.1537L7.83409 27.0093Z" fill="#E27625" /><path d="M17.5203 10.8677L17.8304 20.8807L8.55371 20.4587L11.1924 16.4778L11.2258 16.4394L17.5203 10.8677Z" fill="#E27625" /><path d="M22.3831 10.7559L28.7737 16.4397L28.8067 16.4778L31.4455 20.4586L22.1709 20.8806L22.3831 10.7559Z" fill="#E27625" /><path d="M12.4115 27.0381L17.4768 30.9848L11.5928 33.8257L12.4115 27.0381Z" fill="#E27625" /><path d="M27.5893 27.0376L28.391 33.8258L22.5234 30.9847L27.5893 27.0376Z" fill="#E27625" /><path d="M22.6523 30.6128L28.6066 33.4959L23.0679 36.1282L23.1255 34.3884L22.6523 30.6128Z" fill="#D5BFB2" /><path d="M17.3458 30.6143L16.8913 34.3601L16.9286 36.1263L11.377 33.4961L17.3458 30.6143Z" fill="#D5BFB2" /><path d="M15.6263 22.1875L17.1822 25.4575L11.8848 23.9057L15.6263 22.1875Z" fill="#233447" /><path d="M24.3739 22.1875L28.133 23.9053L22.8184 25.4567L24.3739 22.1875Z" fill="#233447" /><path d="M12.8169 27.0049L11.9606 34.0423L7.37109 27.1587L12.8169 27.0049Z" fill="#CC6228" /><path d="M27.1836 27.0049L32.6296 27.1587L28.0228 34.0425L27.1836 27.0049Z" fill="#CC6228" /><path d="M31.5799 20.0605L27.6165 24.0998L24.5608 22.7034L23.0978 25.779L22.1387 20.4901L31.5799 20.0605Z" fill="#CC6228" /><path d="M8.41797 20.0605L17.8608 20.4902L16.9017 25.779L15.4384 22.7038L12.3988 24.0999L8.41797 20.0605Z" fill="#CC6228" /><path d="M8.15039 19.2314L12.6345 23.7816L12.7899 28.2736L8.15039 19.2314Z" fill="#E27525" /><path d="M31.8538 19.2236L27.2061 28.2819L27.381 23.7819L31.8538 19.2236Z" fill="#E27525" /><path d="M17.6412 19.5088L17.8217 20.6447L18.2676 23.4745L17.9809 32.166L16.6254 25.1841L16.625 25.1119L17.6412 19.5088Z" fill="#E27525" /><path d="M22.3562 19.4932L23.3751 25.1119L23.3747 25.1841L22.0158 32.1835L21.962 30.4328L21.75 23.4231L22.3562 19.4932Z" fill="#E27525" /><path d="M27.7797 23.6011L27.628 27.5039L22.8977 31.1894L21.9414 30.5138L23.0133 24.9926L27.7797 23.6011Z" fill="#F5841F" /><path d="M12.2373 23.6011L16.9873 24.9926L18.0591 30.5137L17.1029 31.1893L12.3723 27.5035L12.2373 23.6011Z" fill="#F5841F" /><path d="M10.4717 32.6338L16.5236 35.5013L16.4979 34.2768L17.0043 33.8323H22.994L23.5187 34.2753L23.48 35.4989L29.4935 32.641L26.5673 35.0591L23.0289 37.4894H16.9558L13.4197 35.0492L10.4717 32.6338Z" fill="#C0AC9D" /><path d="M22.2191 30.231L23.0748 30.8354L23.5763 34.8361L22.8506 34.2234H17.1513L16.4395 34.8485L16.9244 30.8357L17.7804 30.231H22.2191Z" fill="#161616" /><path d="M37.9395 0.351562L39.9998 6.53242L38.7131 12.7819L39.6293 13.4887L38.3895 14.4346L39.3213 15.1542L38.0875 16.2779L38.8449 16.8264L36.8347 19.1742L28.5894 16.7735L28.5179 16.7352L22.5762 11.723L37.9395 0.351562Z" fill="#763E1A" /><path d="M2.06031 0.351562L17.4237 11.723L11.4819 16.7352L11.4105 16.7735L3.16512 19.1742L1.15488 16.8264L1.91176 16.2783L0.678517 15.1542L1.60852 14.4354L0.350209 13.4868L1.30098 12.7795L0 6.53265L2.06031 0.351562Z" fill="#763E1A" /><path d="M28.1861 16.2485L36.9226 18.7921L39.7609 27.5398L32.2728 27.5398L27.1133 27.6049L30.8655 20.2912L28.1861 16.2485Z" fill="#F5841F" /><path d="M11.8139 16.2485L9.13399 20.2912L12.8867 27.6049L7.72971 27.5398H0.254883L3.07728 18.7922L11.8139 16.2485Z" fill="#F5841F" /><path d="M25.5283 5.17383L23.0847 11.7736L22.5661 20.6894L22.3677 23.4839L22.352 30.6225H17.6471L17.6318 23.4973L17.4327 20.6869L16.9139 11.7736L14.4707 5.17383H25.5283Z" fill="#F5841F" /></svg>
                <span className="flex-1 ml-3 whitespace-nowrap">MetaMask</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">Popular</span>
              </div>
            </li>
          </ul>
          <div>
            <a href="#" className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400">
              <svg className="w-3 h-3 mr-2" aria-hidden="true" focusable="false" data-prefix="far" data-icon="question-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path></svg>
              Why do I need to connect with my wallet?</a>
          </div>
        </div>
        </div>
      </main>
    )
  }
  else {
    return (
      <main
        className={`${inter.className}`}
      >
        <nav className='py-8 mb-12 flex justify-between px-10 shadow-white border-2 border-emerald-300 border-t-0 border-x-0 shadow-md rounded-md'>
          <button onClick={() => setOnXChange(true)}>
            <h1 className='text-md sm:text-xl font-bold text-white text-shadow shadow-emerald-300'>XChange</h1>
          </button>
          <ul className='flex items-center'>
            <li className='text-md sm:text-2xl'>
              <button onClick={() => setOnXChange(false)}>
                <h1 className='text-md sm:text-xl font-bold text-white text-shadow shadow-red-300'>Liquidity Pool</h1>
              </button>
            </li>
          </ul>
        </nav>
        <div className="grid grid-cols-1 md:grid-cols-2 place-items-center">
          <div className="justify-center mb-10 text-center rounded-lg bg-neutral p-7 shadow-md shadow-white border-emerald-300 border-2 ">
            <h5
              class="mb-2 text-3xl font-bold leading-tight text-neutral-800 dark:text-neutral-50">
              Supply Liquidity
            </h5>
            <div class="block my-5">
              <label id="fromTicker" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                ETH
              </label>
              <input
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
                id="eth"
                onChange={(e) => {
                  setAddEther(e.target.value || "");
                }}
              />
            </div>
            <div className="">
              <button disabled={true}>
                <FaPlus />
              </button>
            </div>
            <div class="block my-5">
              <label id="fromTicker" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                XTK
              </label>
              <input
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
                id="xtk"
                onChange={(e) => {
                  setAddXTokens(ethers.parseEther(e.target.value || "0"))
                }}
              />
            </div>
            <h5
              class="mb-2 text-2xl font-bold leading-tight text-neutral-800 dark:text-neutral-50">
              Recieve
            </h5>
            <div class="block my-5">
              <label id="fromTicker" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                LP
              </label>
              <input
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
                id="to"
              />
            </div>
            <button
              type="button"
              class="inline-block rounded bg-primary px-5 py-2 text-xs font-medium leading-normal text-white border-2 border-white hover:opacity-90 hover:border-emerald-300"
              data-te-ripple-init
              data-te-ripple-color="light"
              onClick={_addLiquidity}>
              Add
            </button>
          </div>
          <div className="justify-center text-center rounded-lg bg-neutral p-6 shadow-md shadow-white border-emerald-300 border-2 ">
            <h5
              class="mb-2 text-3xl font-bold leading-tight text-neutral-800 dark:text-neutral-50">
              Remove Liquidity
            </h5>
            <div class="block my-5">
              <label id="fromTicker" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                LP
              </label>
              <input
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
                id="LP"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
              />
            </div>
            <h5
              class="mb-2 text-xl font-bold leading-tight text-neutral-800 dark:text-neutral-50">
              {removeMessage}
            </h5>
            <button
              type="button"
              class="inline-block rounded bg-primary px-5 py-2 text-xs font-medium leading-normal text-white border-2 border-white hover:opacity-90 hover:border-emerald-300"
              data-te-ripple-init
              data-te-ripple-color="light"
              onClick={_removeLiquidity}>
              Remove
            </button>
          </div>
        </div>
        <div className="max-w-sm mx-auto mt-10 p-4 border border-gray-200 rounded-lg shadow sm:p-6 bg-gray-800 justify-center">
          <h5 className="mb-3 font-semibold text-sm text-white">
            {walletAddress}
          </h5>
          <ul className="my-4 space-y-3 text-left">
            <li>
              <div className="flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white hover:cursor-pointer" onClick={connectWallet}>
                <svg aria-hidden="true" className="h-4" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M39.0728 0L21.9092 12.6999L25.1009 5.21543L39.0728 0Z" fill="#E17726" /><path d="M0.966797 0.0151367L14.9013 5.21656L17.932 12.7992L0.966797 0.0151367Z" fill="#E27625" /><path d="M32.1656 27.0093L39.7516 27.1537L37.1004 36.1603L27.8438 33.6116L32.1656 27.0093Z" fill="#E27625" /><path d="M7.83409 27.0093L12.1399 33.6116L2.89876 36.1604L0.263672 27.1537L7.83409 27.0093Z" fill="#E27625" /><path d="M17.5203 10.8677L17.8304 20.8807L8.55371 20.4587L11.1924 16.4778L11.2258 16.4394L17.5203 10.8677Z" fill="#E27625" /><path d="M22.3831 10.7559L28.7737 16.4397L28.8067 16.4778L31.4455 20.4586L22.1709 20.8806L22.3831 10.7559Z" fill="#E27625" /><path d="M12.4115 27.0381L17.4768 30.9848L11.5928 33.8257L12.4115 27.0381Z" fill="#E27625" /><path d="M27.5893 27.0376L28.391 33.8258L22.5234 30.9847L27.5893 27.0376Z" fill="#E27625" /><path d="M22.6523 30.6128L28.6066 33.4959L23.0679 36.1282L23.1255 34.3884L22.6523 30.6128Z" fill="#D5BFB2" /><path d="M17.3458 30.6143L16.8913 34.3601L16.9286 36.1263L11.377 33.4961L17.3458 30.6143Z" fill="#D5BFB2" /><path d="M15.6263 22.1875L17.1822 25.4575L11.8848 23.9057L15.6263 22.1875Z" fill="#233447" /><path d="M24.3739 22.1875L28.133 23.9053L22.8184 25.4567L24.3739 22.1875Z" fill="#233447" /><path d="M12.8169 27.0049L11.9606 34.0423L7.37109 27.1587L12.8169 27.0049Z" fill="#CC6228" /><path d="M27.1836 27.0049L32.6296 27.1587L28.0228 34.0425L27.1836 27.0049Z" fill="#CC6228" /><path d="M31.5799 20.0605L27.6165 24.0998L24.5608 22.7034L23.0978 25.779L22.1387 20.4901L31.5799 20.0605Z" fill="#CC6228" /><path d="M8.41797 20.0605L17.8608 20.4902L16.9017 25.779L15.4384 22.7038L12.3988 24.0999L8.41797 20.0605Z" fill="#CC6228" /><path d="M8.15039 19.2314L12.6345 23.7816L12.7899 28.2736L8.15039 19.2314Z" fill="#E27525" /><path d="M31.8538 19.2236L27.2061 28.2819L27.381 23.7819L31.8538 19.2236Z" fill="#E27525" /><path d="M17.6412 19.5088L17.8217 20.6447L18.2676 23.4745L17.9809 32.166L16.6254 25.1841L16.625 25.1119L17.6412 19.5088Z" fill="#E27525" /><path d="M22.3562 19.4932L23.3751 25.1119L23.3747 25.1841L22.0158 32.1835L21.962 30.4328L21.75 23.4231L22.3562 19.4932Z" fill="#E27525" /><path d="M27.7797 23.6011L27.628 27.5039L22.8977 31.1894L21.9414 30.5138L23.0133 24.9926L27.7797 23.6011Z" fill="#F5841F" /><path d="M12.2373 23.6011L16.9873 24.9926L18.0591 30.5137L17.1029 31.1893L12.3723 27.5035L12.2373 23.6011Z" fill="#F5841F" /><path d="M10.4717 32.6338L16.5236 35.5013L16.4979 34.2768L17.0043 33.8323H22.994L23.5187 34.2753L23.48 35.4989L29.4935 32.641L26.5673 35.0591L23.0289 37.4894H16.9558L13.4197 35.0492L10.4717 32.6338Z" fill="#C0AC9D" /><path d="M22.2191 30.231L23.0748 30.8354L23.5763 34.8361L22.8506 34.2234H17.1513L16.4395 34.8485L16.9244 30.8357L17.7804 30.231H22.2191Z" fill="#161616" /><path d="M37.9395 0.351562L39.9998 6.53242L38.7131 12.7819L39.6293 13.4887L38.3895 14.4346L39.3213 15.1542L38.0875 16.2779L38.8449 16.8264L36.8347 19.1742L28.5894 16.7735L28.5179 16.7352L22.5762 11.723L37.9395 0.351562Z" fill="#763E1A" /><path d="M2.06031 0.351562L17.4237 11.723L11.4819 16.7352L11.4105 16.7735L3.16512 19.1742L1.15488 16.8264L1.91176 16.2783L0.678517 15.1542L1.60852 14.4354L0.350209 13.4868L1.30098 12.7795L0 6.53265L2.06031 0.351562Z" fill="#763E1A" /><path d="M28.1861 16.2485L36.9226 18.7921L39.7609 27.5398L32.2728 27.5398L27.1133 27.6049L30.8655 20.2912L28.1861 16.2485Z" fill="#F5841F" /><path d="M11.8139 16.2485L9.13399 20.2912L12.8867 27.6049L7.72971 27.5398H0.254883L3.07728 18.7922L11.8139 16.2485Z" fill="#F5841F" /><path d="M25.5283 5.17383L23.0847 11.7736L22.5661 20.6894L22.3677 23.4839L22.352 30.6225H17.6471L17.6318 23.4973L17.4327 20.6869L16.9139 11.7736L14.4707 5.17383H25.5283Z" fill="#F5841F" /></svg>
                <span className="flex-1 ml-3 whitespace-nowrap">MetaMask</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">Popular</span>
              </div>
            </li>
          </ul>
          <div>
            <a href="#" className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400">
              <svg className="w-3 h-3 mr-2" aria-hidden="true" focusable="false" data-prefix="far" data-icon="question-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path></svg>
              Why do I need to connect with my wallet?</a>
          </div>
        </div>
      </main>
    )
  }
}
