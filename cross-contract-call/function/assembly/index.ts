import { Bytes, debug, util, allocate as _allocate } from "idena-sdk-as"

export function deploy(): void {}

@idenaBindgenIgnore
export function inc(x: i32): i32 {
  debug(`inc xValue ptr=${x}`)
  let xValue = util.ptrToBytes(x).toU64()
  debug(`inc xValue=${xValue}`)
  return util.bytesToPtr(Bytes.fromU64(xValue + 1))
}

@idenaBindgenIgnore
export function allocate(size: u32): usize {
  return _allocate(size)
}
