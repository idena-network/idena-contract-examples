const path = require("path")
const fs = require("fs")

const { toHexString, hexToUint8Array } = require("idena-sdk-js")

const {
  ContractRunnerProvider,
  ContractArgumentFormat,
} = require("idena-sdk-tests")

const provider = ContractRunnerProvider.create("http://localhost:3333", "")

it("can deploy and call execute", async () => {
  const wasm = path.join(".", "build", "release", "hello-world.wasm")

  const code = fs.readFileSync(wasm)

  await provider.Chain.generateBlocks(1)
  await provider.Chain.resetTo(2)

  const deployTx = await provider.Contract.deploy(
    "99999",
    "9999",
    code,
    Buffer.from("")
  )
  await provider.Chain.generateBlocks(1)

  const deployReceipt = await provider.Chain.receipt(deployTx)
  expect(deployReceipt.success).toBe(true)

  const tx = await provider.Contract.call(
    deployReceipt.contract,
    "hello",
    "0",
    "9999"
  )

  await provider.Chain.generateBlocks(1)

  const receipt = await provider.Chain.receipt(tx)
  console.log(receipt)
  expect(receipt.success).toBe(true)
  expect(receipt.events.length).toBe(1)

  expect(receipt.events[0].event).toBe("Hello world!")
  expect(
    new TextDecoder().decode(hexToUint8Array(receipt.ActionResult.outputData))
  ).toBe("hello world")
})
