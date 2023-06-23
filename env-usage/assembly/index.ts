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
import { ComplexObj } from "./complexObj"

export class Contract {
  constructor() {
    util.assert(
      Context.payAmount().toString() == "99999000000000000000000",
      "pay amount is wrong"
    )
    util.assert(
      Context.payAmount() == Context.contractBalance(),
      "pay amount is not equal to contract balance"
    )
  }

  execute(): void {
    util.assert(Context.payAmount() == Balance.Zero, "pay amount is not 0")
    log(`contract balance = ${Context.contractBalance().toString()}`)
    util.assert(
      Context.contractBalance().toString() == "99999000000000000000000",
      "contract balance is wrong 1"
    )
    let data = new Uint8Array(3)
    data[0] = 1
    data[1] = 23
    data[2] = 12
    const hash = Host.keccac256(data)
    util.assert(
      hash.toHex() ==
        "3f1455348a77d64f868d71161f6de8ae4b4d1044774e71fa83f9b53fb7dbbe4f",
      "hash is wrong"
    )
    Host.emitEvent("hash of data", [hash])

    let header = Host.blockHeader(2)

    util.assert(header.proposedHeader!.height == 2, "block is not found")
    util.assert(
      header.proposedHeader!.blockSeed.length > 0,
      "block seed is empty"
    )
    util.assert(
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

    util.assert(
      Context.contractBalance().toString() == "99998000000000000000000",
      "contract balance is wrong 2"
    )

    Host.createTransferPromise(
      Address.fromBytes(Bytes.fromI16(12)),
      Balance.from("500000000000000000")
    )

    util.assert(
      Context.contractBalance().toString() == "99997500000000000000000",
      "contract balance is wrong 3"
    )

    let globalState = Host.globalState()
    util.assert(
      util.toHexString(globalState.godAddress, false) ==
        Context.caller().toHex(),
      "god is not equal to caller"
    )
    util.assert(
      Balance.fromBytes(globalState.feePerGas) > Balance.Zero,
      "fee per gas should be positive"
    )

    const gasLimit = Context.gasLimit()
    const gasLeft = Context.gasLeft()
    util.assert(
      gasLeft > 0 && gasLimit > gasLeft,
      `gasLimit=${gasLimit} < gasLeft=${gasLeft}`
    )

    Host.createReadContractDataPromise(
      Address.fromBytes(Bytes.fromI16(11)),
      util.stringToBytes("result"),
      30000
    ).then("_read__contract_data_callback", [], Balance.Zero, 200000)
  }

  execute2(): void {
    log(`dd=${Context.contractBalance().toString()}`)
    util.assert(Context.payAmount() == Balance.from(1), "pay amount is wrong")

    Host.createCallFunctionPromise(
      Address.fromBytes(Bytes.fromI16(10)),
      "call-to-not-a-contract",
      [],
      BASE_IDNA,
      200000
    )
    util.assert(
      Context.contractBalance().toString() == "99997500000000000000001",
      "contract balance is wrong 4"
    )

    Host.createCallFunctionPromise(
      Context.contractAddress(),
      "empty",
      [],
      BASE_IDNA,
      200000
    ).then("panic", [], BASE_IDNA, 100000)

    Host.createDeployContractPromise(
      new Uint8Array(10),
      [Bytes.fromBytes(new Uint8Array(1000))],
      Bytes.fromString(""),
      BASE_IDNA,
      100000
    )
    Host.burn(BASE_IDNA)

    util.assert(
      Host.ecrecover(new Bytes(1), new Bytes(65)).length == 0,
      "pubkey should be empty"
    )

    const testMsg = util.decodeFromHex(
      "0xce0677bb30baa8cf067c88db9811f4333d131bf8bcf12fe7065d211dce971008"
    )
    const testSig = util.decodeFromHex(
      "0x90f27b8b488db00b00606796d2987f6a5f59ae62ea05effe84fef5b8b0e549984a691139ad57a3f0b906637673aa2f63d1f55cb1a69199d4009eea23ceaddc9301"
    )
    const testPubKey =
      "0x04e32df42865e97135acfb65f3bae71bdc86f4d49150ad6a440b6f15878109880a0a2b2667f7e725ceea70c673093bf67663e0312623c8e091b13cf2c0f11ef652"
    let recovered = Host.ecrecover(testMsg, testSig)
    util.assert(
      util.toHexString(recovered, true) == testPubKey,
      "pubkeys should be equal"
    )
    let recoveredAddr = Address.fromBytes(
      Host.keccac256(recovered.slice(1)).slice(12)
    ).toHex()

    util.assert(
      recoveredAddr == "a19d069d48d2e9392ec2bb41ecab0a72119d633b",
      "address should be equal"
    )
  }

  empty(): void {}

  panic(): void {
    throw new Error("panic")
  }

  @privateMethod
  emitEvents(): void {
    Host.emitEvent("some-event", [Context.caller(), Context.originalCaller()])
  }
  @privateMethod
  _callback(): void {
    Host.emitEvent("some-event2", [Context.caller(), Context.originalCaller()])
  }

  _read__contract_data_callback(): void {
    let r = Host.promiseResult()
    util.assert(!r.failed() && !r.empty(), "promise shoud be successful")
    util.assert(r.data.toU8() == 1, "data of promise should be 1")
  }

  execute3(): void {
    Host.createCallFunctionPromise(
      Context.contractAddress(),
      "empty",
      [],
      BASE_IDNA,
      2000000
    ).then("panic", [], BASE_IDNA, 2000000)

    Host.createDeployContractPromise(
      new Uint8Array(10),
      [Bytes.fromBytes(new Uint8Array(1000))],
      Bytes.fromString(""),
      BASE_IDNA,
      2000000
    )

    Host.createGetIdentityPromise(Address.fromBytes(new Uint8Array(20)), 100000)
    Host.createReadContractDataPromise(
      Context.contractAddress(),
      new Uint8Array(10),
      100000
    )
    throw new Error("panic")
  }

  @privateMethod
  emitEvents2(index: u8): void {
    Host.emitEvent("some-event", [Bytes.fromI8(index)])
    Host.emitEvent("some-event 2", [Bytes.fromI8(index)])
    if (index == 0) {
      Host.createCallFunctionPromise(
        Context.contractAddress(),
        "emitEvents2",
        [Bytes.fromI8(1)],
        Balance.Zero,
        400000
      )
    }
  }

  subcallEmitEvent(): void {
    Host.emitEvent("test event 1", [])
    Host.createCallFunctionPromise(
      Context.contractAddress(),
      "emitEvents2",
      [Bytes.fromI8(0)],
      Balance.Zero,
      1400000
    )
  }

  execute4(): void {
    Host.emitEvent("test event 0", [])
    Host.createCallFunctionPromise(
      Context.contractAddress(),
      "subcallEmitEvent",
      [],
      Balance.Zero,
      3000000
    )
  }

  acceptJsonObj(arg: ComplexObj[]): void {
    debug("prop1=" + arg[0].prop1)
    debug("prop2=" + arg[0].prop2.toString())
    debug("prop3 len=" + arg[0].prop3.length.toString())

    debug("prop1=" + arg[1].prop1)
  }
}
