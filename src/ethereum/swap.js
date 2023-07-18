import tokenContract  from "./token";
import dexContract from "./dex";

export const getAmountOfTokensRecievedFromSwap = async (_swapAmountWei, provider, ethSelected, ethBalance, reservedXTK) => {
    const xchangeContract = dexContract(provider);
    let amountOfTokens;
    if(ethSelected) {
        amountOfTokens = await xchangeContract.calcAmountTokens(_swapAmountWei, ethBalance, reservedXTK);
    }
    else {
        amountOfTokens = await xchangeContract.calcAmountTokens(_swapAmountWei, reservedXTK, ethBalance);
    };
    return amountOfTokens;
}

export const swapTokens = async (signer, swapAmountWei, tokensToBeRecieved, ethSelected) => {
    const xchangeContract = dexContract(signer);
    const tContract = tokenContract(signer);
    let tx;
    if(ethSelected) {
        tx = await xchangeContract.ethToXToken(tokensToBeRecieved, {value: swapAmountWei});
    } 
    else {
        tx = await tContract.approve("0x2c347FcB2CBd48D000885bc1422fb3b9a9caf32b", swapAmountWei.toString());
        await tx.wait();
        tx = await xchangeContract.xTokenToEth(swapAmountWei, tokensToBeRecieved);
    };
    await tx.wait();
}
