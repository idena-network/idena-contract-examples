import { Address, Balance } from "idena-sdk-as"

@idenaBindgen
export class SwapAction {
    poolId : u32
    tokenIn : Address
    amountIn : Balance
    tokenOut: Address
    minAmountOut : Balance
    
    constructor(poolId : u32, tokenIn : Address, amountIn : Balance, tokenOut : Address, minAmountOut : Balance) {        
        this.poolId = poolId;
        this.tokenIn = tokenIn;
        this.amountIn = amountIn;
        this.tokenOut = tokenOut;
        this.minAmountOut = minAmountOut;
    }
}