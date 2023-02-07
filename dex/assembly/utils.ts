import { Address } from "idena-sdk-as"

export function sortTokens(tokens: Address[]): Address[] {
  tokens.sort(compareAddress)
  return tokens
}

export function compareAddress(a: Address, b: Address): i32 {
  if (a.length > b.length) {
    return 1
  }
  if (a.length < b.length) {
    return -1
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) {
      return 1
    }
    if (a[i] < b[i]) {
      return -1
    }
  }
  return 0
}
