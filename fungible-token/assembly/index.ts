import {
  Address,
  Balance,
  Bytes,
  Context,
  Host,
  PersistentMap,
  util,
} from "idena-sdk-as"

export class FungibleToken {
  balances: PersistentMap<Address, Balance>
  total_supply: Balance

  constructor() {
    this.balances = PersistentMap.withStringPrefix<Address, Balance>("b:")
    this.total_supply = Balance.from(1000000)

    this._deposit(Context.caller(), Balance.from(1000000))
  }

  _deposit(addr: Address, amount: Balance): void {
    var balance = this.balances.get(addr, Balance.from(0))
    this.balances.set(addr, balance + amount)
  }

  _withdraw(addr: Address, amount: Balance): void {
    var balance = this.balances.get(addr, Balance.from(0))
    assert(
      balance >= amount,
      `the address ${addr.toHex()} doesn't have enough balance}`
    )
    this.balances.set(addr, balance - amount)
  }

  _transfer(sender: Address, destination: Address, amount: Balance): void {
    assert(sender != destination, "caller and receiver should be different")
    assert(amount > Balance.from(0), "The amount should be a positive number")
    this._withdraw(sender, amount)
    this._deposit(destination, amount)
    Host.emitEvent("transfer", [
      sender,
      destination,
      Bytes.fromBytes(amount.toBytes()),
    ])
  }

  _resolve_transfer(
    sender: Address,
    destination: Address,
    amount: Balance,
    context: string
  ): void {
    var unUsedAmount = Balance.from(0)
    let promiseResult = Host.promiseResult()
    if (promiseResult.failed()) {
      unUsedAmount = amount
    } else {
      unUsedAmount = Balance.fromBytes(promiseResult.data)
      if (unUsedAmount > amount) {
        unUsedAmount = amount
      }
    }
    if (unUsedAmount > Balance.from(0)) {
      let destBalance = this.balances.get(destination, Balance.from(0))
      let refundAmount = unUsedAmount
      if (refundAmount > destBalance) {
        refundAmount = destBalance
      }
      if (refundAmount > Balance.from(0)) {
        this._transfer(destination, sender, refundAmount)
        Host.emitEvent("refund", [
          destination,
          sender,
          Bytes.fromBytes(refundAmount.toBytes()),
        ])
      }
    }
  }

  transfer(destination: Address, amount: Balance): void {
    this._transfer(Context.caller(), destination, amount)
  }

  transfer_call(
    destination: Address,
    amount: Balance,
    context: string = ""
  ): void {
    const sender = Context.caller()
    this._transfer(sender, destination, amount)

    Host.createCallFunctionPromise(
      destination,
      "on_transfer",
      [
        sender,
        Bytes.fromBytes(amount.toBytes()),
        Bytes.fromBytes(util.stringToBytes(context)),
      ],
      Balance.from(0),
      200000
    ).then(
      "_resolve_transfer",
      [
        sender,
        destination,
        Bytes.fromBytes(amount.toBytes()),
        Bytes.fromBytes(util.stringToBytes(context)),
      ],
      Balance.from(0),
      800000
    )
  }
}
