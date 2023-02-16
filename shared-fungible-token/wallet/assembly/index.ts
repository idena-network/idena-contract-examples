import {
  Address,
  Balance,
  Bytes,
  Context,
  debug,  
  Host,
  KeyValue,  
} from "idena-sdk-as"

export class SharedFungibleToken {
  owner: KeyValue<string, Address>
  root: KeyValue<string, Address>
  balance: KeyValue<string, Balance>

  constructor(owner: Address, root: Address) {
    this.owner = new KeyValue("o")
    this.root = new KeyValue("r")
    this.balance = new KeyValue("b")
    this.owner.set(owner)
    this.root.set(root)    
  }

  transferTo(recipient: Address, amount: Balance): void {    

    assert(this.getBalance() >= amount, "not enough tokens on account");
    assert(amount > Balance.from(0), "amount should be positive");

    let ownerAddr = this.owner.get(new Address(0));    
    assert(
      Context.caller().toHex() == ownerAddr.toHex(),
      "sender is not an owner"
    )

    let root = this.root.get(new Address(0));
    
    Host.createDeployContractPromise(Context.contractCode(), [recipient, root], new Bytes(0), Balance.from(0), 700000).then(
        "_deploy_wallet_callback", [recipient, Bytes.fromBytes(amount.toBytes()) ], Balance.from(0), 8500000
    );    
  }

  @view
  getBalance(): Balance {
    let b =  this.balance.get(Balance.from(0))
    debug("getBalance="+b.value.toString())
    return b;
  }

  _addBalance(tokens: Balance): void {
    let b = this.getBalance()
    assert(b + tokens > b, "overflow")
    b = b + tokens
    this.balance.set(b)

    debug("addBalance="+b.value.toString())
  }

  _subBalance(tokens: Balance): void {
    let b = this.getBalance()
    b = b - tokens
    this.balance.set(b)
    debug("subBalance="+b.value.toString())
  }

  receive(amount: Balance, sender_owner: Address): void {
    let caller = Context.caller()
    let rootAddr = this.root.get(new Address(0))
    debug(`sender=${sender_owner.toHex()} root=${rootAddr.toHex()}`);    
    let requiredCaller = Host.contractAddressByHash(
      Context.contractCodeHash(),
      [sender_owner, rootAddr],
      new Bytes(0)
    )
    debug(`caller=${caller.toHex()} required=${requiredCaller.toHex()}`)
    assert(caller.toHex() == requiredCaller.toHex(), "sender is invalid")

    this._addBalance(amount)
    debug("received="+amount.value.toString())
  }

  _deploy_wallet_callback(recipient: Address, amount: Balance): void {
    let ownerAddr = this.owner.get(new Address(0))

    let root = this.root.get(new Address(0))
    assert(this.getBalance() >= amount, "not enough tokens on account")
    this._subBalance(amount)

    let destination = Host.contractAddressByHash(
        Context.contractCodeHash(),
      [recipient, root],
      new Bytes(0)
    )

    Host.createCallFunctionPromise(
      destination,
      "receive",
      [Bytes.fromBytes(amount.toBytes()), ownerAddr],
      Balance.from(0),
      2500000
    ).then(
      "_send_tokens_callback",
      [Bytes.fromBytes(amount.toBytes())],
      Balance.from(0),
      2500000
    )
  }

  _send_tokens_callback(amount: Balance): void {
    let result = Host.promiseResult()

    debug(`failed=${result.failed()} amount=${amount.value.toString()}`);

    if (result.failed()) {
      this._addBalance(amount)
    }
  }
}
