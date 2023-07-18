import tokenContract  from "./token";
import dexContract from "./dex";
import { ethers } from "ethers";

export const removeLiquidity = async (signer, removeLPTokensWei) => {
    const xchangeContract = dexContract(signer);
    const tx = await xchangeContract.removeLiquidity(removeLPTokensWei);
    await tx.wait();
};

export const getTokensAfterRemove = async (provider, removeLPTokensWei, _ethBalance, xtkReserve) => {
    try {
        const xchangeContract = dexContract(provider);
        const _totalSupply = await xchangeContract.totalSupply();
        const _removeEther = (_ethBalance * removeLPTokensWei) /_totalSupply;
        const _removeXTK = (xtkReserve * removeLPTokensWei) /_totalSupply;
        console.log(ethers.formatEther(_removeXTK))
        return {_removeEther, _removeXTK};
    }
    catch (err) {
        console.error(err);
        return 0;
    }
}
