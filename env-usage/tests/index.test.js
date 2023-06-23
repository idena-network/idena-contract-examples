const path = require("path")
const fs = require("fs")

const {
  ContractRunnerProvider,
  ContractArgumentFormat,
  ContractArgument,
  successOfAllActions,
} = require("idena-sdk-tests")

it("can deploy and call execute", async () => {
  const wasm = path.join(".", "build", "release", "env-usage.wasm")
  const provider = ContractRunnerProvider.create("http://localhost:3333", "")
  const code = fs.readFileSync(wasm)

  await provider.Chain.generateBlocks(1)
  await provider.Chain.resetTo(2)

  const god = await provider.Chain.godAddress()

  const deployTx = await provider.Contract.deploy(
    "99999",
    "9999",
    code,
    Buffer.from("")
  )
  await provider.Chain.generateBlocks(1)

  const deployReceipt = await provider.Chain.receipt(deployTx)
  expect(deployReceipt.success).toBe(true)

  await provider.Chain.setContractData(
    "0x0B00000000000000000000000000000000000000",
    "result",
    "1",
    "byte"
  )

  expect(
    await provider.Contract.readData(
      "0x0B00000000000000000000000000000000000000",
      "result",
      "byte"
    )
  ).toBe(1)

  let tx = await provider.Contract.call(
    deployReceipt.contract,
    "execute",
    "0",
    "9999"
  )

  await provider.Chain.generateBlocks(1)

  let receipt = await provider.Chain.receipt(tx)
  console.log(receipt)
  expect(receipt.success).toBe(true)

  expect(receipt.events.length).toBe(3)
  expect(receipt.events[1].args[0]).toBe(receipt.contract)
  expect(receipt.events[1].args[1]).toBe(god)

  expect(receipt.events[2].args[0]).toBe(receipt.contract)
  expect(receipt.events[2].args[1]).toBe(god)

  expect(await provider.Chain.balance(deployReceipt.contract)).toBe("99998.5")
  expect(
    await provider.Chain.balance("0x0c00000000000000000000000000000000000000")
  ).toBe("0.5")

  expect(successOfAllActions(receipt)).toBe(true)

  tx = await provider.Contract.call(
    deployReceipt.contract,
    "execute2",
    "0.000000000000000001",
    "9999"
  )

  await provider.Chain.generateBlocks(1)

  receipt = await provider.Chain.receipt(tx)

  expect(receipt.success).toBe(true)
  expect(await provider.Chain.balance(deployReceipt.contract)).toBe(
    "99997.500000000000000001"
  )
  expect(receipt.actionResult.subActionResults[0].success).toBe(false)

  tx = await provider.Contract.call(
    deployReceipt.contract,
    "execute3",
    "0",
    "9999"
  )

  await provider.Chain.generateBlocks(1)

  receipt = await provider.Chain.receipt(tx)
  console.log(receipt)
  expect(receipt.success).toBe(false)
  expect(receipt.gasUsed).toBe(6697)

  tx = await provider.Contract.call(
    deployReceipt.contract,
    "execute4",
    "0",
    "9999"
  )

  await provider.Chain.generateBlocks(1)

  receipt = await provider.Chain.receipt(tx)
  // uncomment after fork 12
  //expect(receipt.events.length).toBe(6)
  console.log(receipt.events)

  tx = await provider.Contract.call(
    deployReceipt.contract,
    "acceptJsonObj",
    "0",
    "9999",
    [
      {
        index: 0,
        format: ContractArgumentFormat.String,
        value: JSON.stringify([{
          prop1: "value 1",
          prop2: "18",
          prop3: ["1", "2", "3"],
        }, {prop1 : "value 2"}]),
      },
    ]
  )

  await provider.Chain.generateBlocks(1)

  receipt = await provider.Chain.receipt(tx)
  expect(receipt.success).toBe(true)
})
