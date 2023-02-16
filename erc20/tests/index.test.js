const fs = require("fs")
const path = require("path")
const BN = require("bn.js")
const util = require("util")
const { toHexString, hexToUint8Array } = require("idena-sdk-js")

const {
  ContractRunnerProvider,
  ContractArgumentFormat,
} = require("idena-sdk-tests")

it("can deploy and call transfer", async () => {
  const wasm = path.join(".", "build", "release", "erc20.wasm")
  const provider = ContractRunnerProvider.create("http://localhost:3333", "")
  const code = fs.readFileSync(wasm)

  await provider.Chain.generateBlocks(1)
  await provider.Chain.resetTo(2)

  const god =  hexToUint8Array(await provider.Chain.godAddress())  

  const deployTx = await provider.Contract.deploy(
    "99999",
    "9999",
    code,
    Buffer.from("")
  )
  await provider.Chain.generateBlocks(1)

  const deployReceipt = await provider.Chain.receipt(deployTx)
  console.log(
    util.inspect(deployReceipt, {
      showHidden: false,
      depth: null,
      colors: true,
    })
  )
  expect(deployReceipt.success).toBe(true)

  let godBalance = await provider.Contract.readMap(
    deployReceipt.contract,
    "b:",
    toHexString(god),
    "bigint"
  )
  expect(godBalance).toBe("1000000000")

  const dest = new Uint8Array(20)
  dest[19] = 1

  let tokens = 100

  const transferTx = await provider.Contract.call(
    deployReceipt.contract,
    "transfer",
    "0",
    "9999",
    [
      {
        index: 0,
        format: ContractArgumentFormat.Hex,
        value: toHexString(dest),
      },
      {
        index: 1,
        format: ContractArgumentFormat.Bigint,
        value: tokens.toString(),
      },
    ]
  )

  await provider.Chain.generateBlocks(1)

  const transferReceipt = await provider.Chain.receipt(transferTx)
  console.log(transferReceipt)
  expect(transferReceipt.success).toBe(true)

  destBalance = await provider.Contract.readMap(
    deployReceipt.contract,
    "b:",
    toHexString(dest),
    "bigint"
  )

  expect(destBalance).toBe(tokens.toString())

  ownerBalance = await provider.Contract.readMap(
    deployReceipt.contract,
    "b:",
    toHexString(god),
    "bigint"
  )
  expect(ownerBalance).toBe((1000000000 - 100).toString())

  const approveTx = await provider.Contract.call(
    deployReceipt.contract,
    "approve",
    "0",
    "9999",
    [
      {
        index: 0,
        format: ContractArgumentFormat.Hex,
        value: toHexString(dest),
      },
      {
        index: 1,
        format: ContractArgumentFormat.Bigint,
        value: tokens.toString(),
      },
    ]
  )
  await provider.Chain.generateBlocks(1)

  let receipt = await provider.Chain.receipt(approveTx)  
  expect(receipt.success).toBe(true)


  const allowanceTx = await provider.Contract.call(
    deployReceipt.contract,
    "allowance",
    "0",
    "9999",
    [
      {
        index: 0,
        format: ContractArgumentFormat.Hex,
        value: toHexString(god),
      },
      {
        index: 1,
        format: ContractArgumentFormat.Hex,
        value: toHexString(dest),
      },
      
    ]
  )
  await provider.Chain.generateBlocks(1)

  receipt = await provider.Chain.receipt(allowanceTx)  
  expect(receipt.success).toBe(true)
  
  expect(receipt.actionResult.outputData).toBe("0x00000000000000000000000000000064")

  let utf8Encode = new TextEncoder()
  const key = toHexString(god, false) + ":" + toHexString(dest, false)



  console.log(`key hex=${toHexString(utf8Encode.encode(key))}`)
  let approve = await provider.Contract.readMap(
    deployReceipt.contract,
    "a:",
    toHexString(utf8Encode.encode(key)),
    "hex"
  )
  console.log(approve)
})
