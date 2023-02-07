
import {
  Address,  
  Context,
  debug,  
  Balance,
  PersistentMap,  
  util,
} from "idena-sdk-as"

//@ts-ignore
@idenaBindgen
export class IRC20 {
  /**
   *
   */
  balances: PersistentMap<Address, Balance>
  approves: PersistentMap<string, Balance>  

  constructor() {
    const TOTAL_SUPPLY: Balance = Balance.from(1000000000)
    this.balances = PersistentMap.withStringPrefix<Address, Balance>("b:");
    this.approves = PersistentMap.withStringPrefix<string, Balance>("a:");    
    this.balances.set(Context.caller(), TOTAL_SUPPLY);        
  }

  @view
  getBalance(owner: Address): Balance {
    return this.balances.get(owner, Balance.from(0))
  }

  transfer(to: Address, amount: Balance): void {
    let sender = Context.caller()

    debug(
      "transfer from: " +
        sender.toHex() +
        " to: " +
        to.toHex() +
        " amount: " +
        amount.value.toString()
    )
    const fromAmount = this.getBalance(sender)
    util.assert(fromAmount >= amount, "not enough tokens on account")
    let destBalance = this.getBalance(to)
    let sum = destBalance + amount
    this.balances.set(sender, fromAmount - amount)
    this.balances.set(to, sum)
  }

  approve(spender: Address, amount: Balance): void {
    let sender = Context.caller()    
    this.approves.set(sender.toHex() + ":" + spender.toHex(), amount)
  }

  @view
  allowance(tokenOwner: Address, spender: Address): Balance {
    const key = tokenOwner.toHex() + ":" + spender.toHex()
    log(`key hex=${util.toHexString(util.stringToBytes(key))}`)
    return this.approves.get(key, Balance.from(0))
  }

  transferFrom(from: Address, to: Address, amount: Balance): void {
    let caller = Context.caller()

    const fromAmount = this.getBalance(from)
    util.assert(fromAmount >= amount, "not enough tokens on account")
    const approvedAmount = this.allowance(from, caller)
    util.assert(
      amount <= approvedAmount,
      "not enough tokens approved to transfer"
    )

    let destBalance = this.getBalance(to)

    this.balances.set(from, fromAmount - amount)
    this.balances.set(to, destBalance + amount)
  }
}