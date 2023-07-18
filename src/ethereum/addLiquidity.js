import { utils } from "ethers";
import tokenContract  from "./token";
import dexContract from "./dex";

export const addLiquidity = async (signer, addXTKAmountWei, addEtherAmountWei) => {
    try {
        const tContract = tokenContract(signer);
        const xchangeContract = dexContract(signer);
        let tx = await tContract.approve("0x2c347FcB2CBd48D000885bc1422fb3b9a9caf32b", addXTKAmountWei.toString());
        await tx.wait();
        tx = await xchangeContract.addLiquidity(addXTKAmountWei, {value: addEtherAmountWei,});
        await tx.wait();
    } catch (err) {
        console.error(err);
    }
};

export const calculateXTK = async (_addEther = "0", etherBalanceContract, xTokenReserve) => {
    const _addEtherAmountWei = utils.parseEther(_addEther);
    const xtkAmount = _addEtherAmountWei.mul(xTokenReserve).div(etherBalanceContract);
    return xtkAmount;
}