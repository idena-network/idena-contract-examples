import { Address, Balance, PersistentMap } from "idena-sdk-as"

@idenaBindgen
export class Account {
  idna: Balance
  tokens: PersistentMap<Address, Balance>

  constructor(addr: Address) {
    let prefix = new Uint8Array(11)
    prefix[0]= 'b'.charCodeAt(0)
    memory.copy(prefix.dataStart, addr.dataStart + 10, 10)
    this.tokens = new PersistentMap(prefix)
    this.idna = Balance.from(0)
  }

  withdraw(token: Address, amount: Balance): void {
    let balance = this.tokens.get(token, Balance.Zero)
    assert(balance >= amount, "not enough tokens")
    this.tokens.set(token, balance - amount)
  }

  deposit(token: Address, amount: Balance): void {
    let balance = this.tokens.get(token, Balance.Zero)
    this.tokens.set(token, balance + amount)
  }
}
