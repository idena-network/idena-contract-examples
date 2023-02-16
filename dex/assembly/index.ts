import {
  Address,
  Balance,
  Bytes,
  Context,
  debug,
  KeyValue,
  PersistentMap,
  util,
  Vector,
} from "idena-sdk-as"
import { Pool } from "./pool"
import { Account } from "./account"
import { compareAddress } from "./utils"
import { SwapAction } from "./types"

export class Dex {
  fee: u32
  owner: Address
  pools: Vector<Pool>
  accounts: PersistentMap<Address, Account>

  constructor(fee: u32) {
    this.owner = Context.caller()
    this.fee = fee
    this.pools = new Vector<Pool>("p")
    this.accounts = PersistentMap.withStringPrefix<Address, Account>("a")

    //let pool = new Pool(1, Address.fromBytes(Bytes.fromI16(1)), Address.fromBytes(Bytes.fromI16(2)), fee)
    //log(`encode=${isDefined(pool.encode)}`)

    //let a = new SwapAction(1, Address.fromBytes(Bytes.fromString("asas")), Balance.Zero,  Address.fromBytes(Bytes.fromString("113")), Balance.from(1))
  }

  addPool(token1: Address, token2: Address, fee: u32): u32 {    
    assert(compareAddress(token1, token2) != 0, "tokens should be different")
    let id = this.pools.length
    if (id < 0) {
      id = 0
    }
    let pool = new Pool(id, token1, token2, fee)
    this.pools.push(pool)
    return id
  }

  addLiquidity(poolId: u32, amount1: Balance, amount2: Balance): void {
    assert(u32(this.pools.length) > poolId, "pool is not found")
    const pool = this.pools[poolId]    
    pool.addLiquidity(amount1, amount2)    
    const caller = Context.caller()

    const account = this.accounts.get(caller, new Account(Context.caller()))    
    const tokens = pool.tokens
    const amounts = [amount1, amount2]
    for (let i = 0; i < 2; i++) {
      account.withdraw(tokens[i], amounts[i])
    }    
    this.accounts.set(caller, account)    
    this.pools[poolId] = pool    
  }

  swap(actions: SwapAction[]): void {
    const sender = Context.caller()
    const account = this.accounts.get(sender, new Account(sender))
    let prevAmount = Balance.Zero
    for (let i = 0; i < actions.length; i++) {
      prevAmount = this._executeAction(account, actions[i], prevAmount)
    }
    this.accounts.set(sender, account)
  }

  _executeAction(
    account: Account,
    action: SwapAction,
    prevAmount: Balance
  ): Balance {
    let amount = action.amountIn
    if (amount == Balance.Zero) {
      amount = prevAmount
    }

    account.withdraw(action.tokenIn, prevAmount)
    const amountOut = this._poolSwap(
      action.poolId,
      action.tokenIn,
      amount,
      action.tokenOut,
      action.minAmountOut
    )
    account.deposit(action.tokenOut, amountOut)
    return amountOut
  }

  _poolSwap(
    poolId: u32,
    tokenIn: Address,
    amountIn: Balance,
    tokenOut: Address,
    minAmountOut: Balance
  ): Balance {
    assert(u32(this.pools.length) < poolId, "pool is not found")
    let pool = this.pools[poolId]
    const amountOut = pool.swap(tokenIn, amountIn, tokenOut, minAmountOut)
    this.pools[poolId] = pool
    return amountOut
  }

  on_transfer(sender: Address, amount: Balance, context: string = ""): Balance {
    const tokenIn = Context.caller()

    let acc = this.accounts.get(sender, new Account(sender))
    acc.deposit(tokenIn, amount)
    this.accounts.set(sender, acc)
    
    if (context.length > 0) {
      let actions: SwapAction[]
      actions = decode<SwapAction[], Uint8Array>(util.stringToBytes(context))
      let prevAmount = Balance.Zero
      for (let i = 0; i < actions.length; i++) {
        prevAmount = this._executeAction(acc, actions[i], prevAmount)
      }
      this.accounts.set(sender, acc)    
    }
    return Balance.Zero
  }
}
