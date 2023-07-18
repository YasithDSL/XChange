import tokenContract  from "./token";
import dexContract from "./dex";

export const getEtherBalance = async (provider, address) => {
    try {
        const balance = await provider.getBalance("0x2c347FcB2CBd48D000885bc1422fb3b9a9caf32b");
        return balance;
    }
    catch (err) {
        console.error(err);
        return 0;
    }
};

export const getXTokenBalance = async (provider, address) => {
    try {
        const balance = await tokenContract(provider).balanceOf(address);
        return balance;
    } catch (err) {
        console.error(err);
        return 0;
    }
};

export const getLPTokenBalance = async (provider, address) => {
    try {
        const contract = dexContract(provider);
        const balance = await contract.balanceOf(address);
        return balance;
    } catch (err) {
        console.error(err);
        return 0;
    }
};

export const getReserveOfXToken = async (provider) => {
    try {
        const contract = dexContract(provider);
        const reserve = await contract.getReserves();
        return reserve;
    } catch (err)
    {
        console.error(err);
        return 0;
    }
};