import { Address, Balance, PersistentMap, u128 } from "idena-sdk-as"
import { compareAddress, sortTokens } from "./utils"
import { Context } from "idena-sdk-as"

const INIT_SHARES_SUPPLY: Balance =
  Balance.from(1_000_000_000_000_000_000_000_000)

const FEE_DIVISOR: u32 = 10_000

@idenaBindgen
export class Pool {
  id: u32
  tokens: Address[]
  amounts: Balance[]
  fee: u32
  shares_total_supply: Balance

  shares: PersistentMap<Address, Balance>

  constructor(id: u32, token1: Address, token2: Address, fee: u32) {
    this.id = id
    this.tokens = sortTokens([token1, token2])
    this.amounts = [Balance.Zero, Balance.Zero]
    this.fee = fee
    this.shares_total_supply = Balance.Zero
    this.shares = PersistentMap.withStringPrefix<Address, Balance>("sh" + id.toString())
  }

  addLiquidity(amount1: Balance, amount2: Balance): void {
    const amounts = [amount1, amount2]
    var shares = Balance.Zero
    if (this.shares_total_supply > Balance.Zero) {
      let fair_supply = new Balance(u128.Max)
      for (let i = 0; i < 2; i++) {
        assert!(amounts[i] > Balance.Zero, "amount shoud be positive")
        fair_supply = Balance.min(
          fair_supply,
          Balance.div(
            Balance.mul(amounts[i], this.shares_total_supply),
            this.amounts[i]
          )
        )
      }
      for (let i = 0; i < 2; i++) {
        let amount = Balance.div(
          Balance.mul(this.amounts[i], fair_supply),
          this.shares_total_supply
        )
        assert!(amount > Balance.Zero, "amount shoud be positive")
        this.amounts[i] = this.amounts[i] + amount
        amounts[i] = amount
      }
      shares = fair_supply
    } else {
      for (let i = 0; i < 2; i++) {
        this.amounts[i] = amounts[i]
      }
      shares = INIT_SHARES_SUPPLY
    }
    this.mintShare(Context.caller(), shares)

    assert!(shares > Balance.Zero, "shares shoud be positive")
  }

  mintShare(addr: Address, shares: Balance): void {
    if (shares == Balance.Zero) {
      return
    }
    this.shares_total_supply = this.shares_total_supply + shares

    let prevShare = this.shares.get(addr, Balance.Zero)
    this.shares.set(addr, prevShare + shares)
  }

  removeLiquidity(
    shares: Balance,
    minAmount1: Balance,
    minAmount2: Balance
  ): Balance[] {
    var result: Balance[] = []

    const addr = Context.caller()

    let prevShares = this.shares.get(addr, Balance.Zero)
    assert(prevShares >= shares, "not enough shares")

    let minAmounts = [minAmount1, minAmount2]

    for (let i = 0; i < 2; i++) {
      let amount = (this.amounts[i] * shares) / this.shares_total_supply
      assert(amount >= minAmounts[i], "err min amount")
      this.amounts[i] = this.amounts[i] - amount
      result.push(amount)
    }
    this.shares.set(addr, prevShares - shares)
    this.shares_total_supply = this.shares_total_supply - shares
    return result
  }

  swap(
    tokenIn: Address,
    amountIn: Balance,
    tokenOut: Address,
    minTokenOut: Balance
  ): Balance {
    assert(compareAddress(tokenIn, tokenOut) != 0, "same token swap")

    const inIdx = this.tokenIndex(tokenIn)
    const outIdx = this.tokenIndex(tokenOut)

    let amountOut = this.internalGetReturn(inIdx, amountIn, outIdx)
    assert(amountOut >= minTokenOut, "err min amount")

    let prevInvariant = this.sqrt(this.amounts[inIdx] * this.amounts[outIdx])

    this.amounts[inIdx] = this.amounts[inIdx] + amountIn
    this.amounts[outIdx] = this.amounts[outIdx] - amountOut

    let newInvariant = this.sqrt(this.amounts[inIdx] * this.amounts[outIdx])

    assert!(newInvariant >= prevInvariant, "ERR_INVARIANT")

    return amountOut
  }

  tokenIndex(token: Address): u32 {
    for (let i = 0; i < 2; i++) {
      if (compareAddress(token, this.tokens[i]) == 0) {
        return i
      }
    }
    assert(false, "token is not found")
    return 0
  }

  internalGetReturn(
    tokenIn: u32,
    amountIn: Balance,
    tokenOut: u32
  ): Balance {
    let inBalance = this.amounts[tokenIn]
    let outBalance = this.amounts[tokenOut]
    assert!(
      inBalance > Balance.Zero &&
        outBalance > Balance.Zero &&
        tokenIn != tokenOut &&
        amountIn > Balance.Zero,
      "invalid swap args"
    )
    let amountWithFee = amountIn * Balance.from(FEE_DIVISOR - this.fee)
    return (
      (amountWithFee * outBalance) /
      (Balance.from(FEE_DIVISOR) * inBalance + amountWithFee)
    )
  }

  sqrt(value: Balance): Balance {
    return Balance.from(u128.sqrt(value.value))
  }
}
