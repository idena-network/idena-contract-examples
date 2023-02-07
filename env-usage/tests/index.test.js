const path = require("path")
const fs = require("fs")

const { toHexString, hexToUint8Array } = require("idena-sdk-js")

const {
  ContractRunnerProvider,
  ContractArgumentFormat,
} = require("idena-sdk-tests")

it("can deploy and call execute", async () => {
  const wasm = path.join(".", "build", "release", "env-usage.wasm")
  const provider = ContractRunnerProvider.create("http://localhost:3333", "")
  const code = fs.readFileSync(wasm)

  await provider.Chain.generateBlocks(1)
  await provider.Chain.resetTo(2)

  const god = await provider.Chain.godAddress() 

  const deployTx = await provider.Contract.deploy("99999", "9999", code, Buffer.from(""))
  await provider.Chain.generateBlocks(1)

  const deployReceipt = await provider.Chain.receipt(deployTx)
  expect(deployReceipt.success).toBe(true)


  const tx = await provider.Contract.call(
    deployReceipt.contract,
    "execute",
    "0",
    "9999"   
  )

  await provider.Chain.generateBlocks(1)

  const receipt = await provider.Chain.receipt(tx)
  console.log(receipt)  
  expect(receipt.success).toBe(true)

  expect(receipt.events.length).toBe(3)
  expect(receipt.events[1].args[0]).toBe(receipt.contract)
  expect(receipt.events[1].args[1]).toBe(god)

  expect(receipt.events[2].args[0]).toBe(receipt.contract)
  expect(receipt.events[2].args[1]).toBe(god)


})