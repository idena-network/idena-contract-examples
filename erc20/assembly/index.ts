
import {
  Address,  
  Context,
  debug,  
  Balance,
  PersistentMap,  
  util,
} from "idena-sdk-as"


export class IRC20 {

  balances: PersistentMap<Address, Balance>
  approves: PersistentMap<string, Balance>  
  _name: string = "TOKEN NAME"
  _symbol: string = "TOKEN SYMBOL"
  _decimals: u8 = 18
  _totalSupply: Balance = Balance.fromString("1000000000000000000000000000") // 1000000000 tokens with 18 decimal places

  constructor() {
    this.balances = PersistentMap.withStringPrefix<Address, Balance>("b:");
    this.approves = PersistentMap.withStringPrefix<string, Balance>("a:");    
    this.balances.set(Context.caller(), _totalSupply);        
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
    this.balances.set(sender, fromAmount - amount)
    let destBalance = this.getBalance(to)
    this.balances.set(to, destBalance + amount)
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
  
  @view 
  totalSupply(): Balance {
    return this._totalSupply
  }
  @view
  name(): string {
    return this._name
  }
  @view
  symbol(): string {
    return this._symbol
  }
  @view
  decimals(): u8 {
    return this._decimals
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

    this.balances.set(from, fromAmount - amount)
    let destBalance = this.getBalance(to)
    this.balances.set(to, destBalance + amount)
  }
}
