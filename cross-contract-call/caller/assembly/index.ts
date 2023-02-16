
import { Address, Balance, Bytes, debug, Host, KeyValue } from "idena-sdk-as"

export class Caller {
  function: Address
  sum : KeyValue<string, u64>

  constructor(functionAddr: Address) {
    this.function = functionAddr
    this.sum = new KeyValue<string, u64>("sum")
  }

  _sum(y: u64): void {
    let res = Host.promiseResult() 
    assert(!res.failed(), "promise result should be successful")
    let x =  res.data.toU64();
    debug(`x=${x}, y=${y}, sum=${x + y}`)
    this.sum.set(x+y);
  }

  invoke(x : u64, y : u64) : void {
    Host.createCallFunctionPromise(this.function,"inc", [Bytes.fromU64(x)], Balance.Zero, 200000)
    .then("_sum", [Bytes.fromU64(y)], Balance.Zero, 400000);
  }
}
