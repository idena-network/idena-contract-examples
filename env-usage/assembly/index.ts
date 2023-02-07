import { Balance, Bytes, Context, debug, Host, util } from "idena-sdk-as"

@idenaBindgen
export class Contract {
  constructor() {}

  execute(): void {
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
      Balance.Zero,
      200000
    ).then("_callback", [], Balance.Zero, 200000)

    let globalState = Host.globalState()    
    assert(util.toHexString(globalState.godAddress, false) == Context.caller().toHex(), "god is not equal to caller")
    assert(Balance.fromBytes(globalState.feePerGas) > Balance.Zero, "fee per gas should be positive")      
  }

  emitEvents(): void {
    Host.emitEvent("some-event", [Context.caller(), Context.originalCaller()])
  }
  _callback(): void {
    Host.emitEvent("some-event2", [Context.caller(), Context.originalCaller()])
  }
}
