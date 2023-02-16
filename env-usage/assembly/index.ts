import {
  Address,
  Balance,
  BASE_IDNA,
  Bytes,
  Context,
  debug,
  Host,
  util,
} from "idena-sdk-as"

export class Contract {
  constructor() {
    assert(Context.payAmount().toString() == "99999000000000000000000")
    assert(Context.payAmount() == Context.contractBalance())
  }

  execute(): void {
    assert(Context.payAmount() == Balance.Zero)
    assert(Context.contractBalance().toString() == "99999000000000000000000")
    let data = new Uint8Array(3)
    data[0] = 1
    data[1] = 23
    data[2] = 12
    const hash = Host.keccac256(data)
    assert(
      hash.toHex() ==
        "3f1455348a77d64f868d71161f6de8ae4b4d1044774e71fa83f9b53fb7dbbe4f",
      "hash is wrong"
    )

    Host.emitEvent("hash of data", [hash])

    let header = Host.blockHeader(2)
    assert(header.proposedHeader!.height == 2, "block is not found")
    assert(header.proposedHeader!.blockSeed.length > 0, "block seed is empty")
    assert(
      header.proposedHeader!.parentHash.length > 0,
      "block parent hash is empty"
    )
    Host.createCallFunctionPromise(
      Context.contractAddress(),
      "emitEvents",
      [],
      Balance.from("1000000000000000000"),
      200000
    ).then("_callback", [], Balance.Zero, 200000)

    assert(Context.contractBalance().toString() == "99998000000000000000000")

    Host.createTransferPromise(
      Address.fromBytes(Bytes.fromI16(12)),
      Balance.from("500000000000000000")
    )

    assert(Context.contractBalance().toString() == "99997500000000000000000")

    let globalState = Host.globalState()
    assert(
      util.toHexString(globalState.godAddress, false) ==
        Context.caller().toHex(),
      "god is not equal to caller"
    )
    assert(
      Balance.fromBytes(globalState.feePerGas) > Balance.Zero,
      "fee per gas should be positive"
    )

    const gasLimit = Context.gasLimit()
    const gasLeft = Context.gasLeft()
    assert(gasLeft > 0 && gasLimit > gasLeft)

    Host.createReadContractDataPromise(
      Address.fromBytes(Bytes.fromI16(11)),
      util.stringToBytes("result"),
      30000
    ).then("_read__contract_data_callback", [], Balance.Zero, 200000)
  }

  execute2(): void {
    log(`dd=${Context.contractBalance().toString()}`)
    assert(Context.payAmount() == Balance.from(1))

    Host.createCallFunctionPromise(
      Address.fromBytes(Bytes.fromI16(10)),
      "call-to-not-a-contract",
      [],
      BASE_IDNA,
      200000
    )
    assert(Context.contractBalance().toString() == "99997500000000000000001")

    Host.createCallFunctionPromise(
      Context.contractAddress(),
      "empty",
      [],
      BASE_IDNA,
      200000
    ).then("panic", [],   BASE_IDNA, 100000)

    Host.createDeployContractPromise(
      new Uint8Array(10),
      [Bytes.fromBytes(new Uint8Array(1000))],
      Bytes.fromString(""),
      BASE_IDNA,
      100000
    )
    Host.burn(BASE_IDNA)  

    assert(Host.ecrecover(new Bytes(1), new Bytes(65)).length == 0, "pubkey should be empty")

    const testMsg = util.decodeFromHex("0xce0677bb30baa8cf067c88db9811f4333d131bf8bcf12fe7065d211dce971008")
    const testSig = util.decodeFromHex("0x90f27b8b488db00b00606796d2987f6a5f59ae62ea05effe84fef5b8b0e549984a691139ad57a3f0b906637673aa2f63d1f55cb1a69199d4009eea23ceaddc9301")
    const testPubKey = "0x04e32df42865e97135acfb65f3bae71bdc86f4d49150ad6a440b6f15878109880a0a2b2667f7e725ceea70c673093bf67663e0312623c8e091b13cf2c0f11ef652"
      
    assert(util.toHexString(Host.ecrecover(testMsg, testSig), true) == testPubKey , "pubkeys should be equal")

  }

  empty(): void {}

  panic(): void {
    throw new Error("panic")
  }

  emitEvents(): void {
    Host.emitEvent("some-event", [Context.caller(), Context.originalCaller()])
  }
  _callback(): void {
    Host.emitEvent("some-event2", [Context.caller(), Context.originalCaller()])
  }

  _read__contract_data_callback(): void {
    let r = Host.promiseResult()
    assert(!r.failed() && !r.empty(), "promise shoud be successful")
    assert(r.data.toU8() == 1, "data of promise should be 1")
  }
}
