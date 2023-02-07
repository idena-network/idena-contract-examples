const path = require("path")
const fs = require("fs")

const {
  ContractRunnerProvider,
  ContractArgumentFormat,
} = require("idena-sdk-tests")

async function deployContract(resetChain = true) {
  const wasm = path.join(".", "build", "release", "fungible-token.wasm")
  const provider = ContractRunnerProvider.create("http://localhost:3333", "")
  const code = fs.readFileSync(wasm)

  if (resetChain) {
    await provider.Chain.generateBlocks(1)
    await provider.Chain.resetTo(2)
  }

  const deployTx = await provider.Contract.deploy("99999", "9999", code, Buffer.from(""))
  await provider.Chain.generateBlocks(1)

  const deployReceipt = await provider.Chain.receipt(deployTx)
  expect(deployReceipt.success).toBe(true)
  return { provider: provider, contract: deployReceipt.contract }
}

it("can deploy and transfer tokens", async () => {
  let { provider, contract } = await deployContract()

  const destination = "0x0000000000000000000000000000000000000001"
  const tokens = 100
  const transferTx = await provider.Contract.call(
    contract,
    "transfer",
    "99999",
    "9999",
    [
      {
        format: ContractArgumentFormat.Hex,
        index: 0,
        value: destination,
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

  const initialOwnerBalance = 1000000

  const owner = await provider.Chain.godAddress()

  ownerBalance = await provider.Contract.readMap(
    contract,
    "b:",
    owner,
    "bigint"
  )
  expect(ownerBalance).toBe((initialOwnerBalance - tokens).toString())

  destBalance = await provider.Contract.readMap(
    contract,
    "b:",
    destination,
    "bigint"
  )

  expect(destBalance).toBe(tokens.toString())
})

it("can deploy and trarsfer call tokens to non-contract address", async () => {
  let { provider, contract } = await deployContract()

  const destination = "0x0000000000000000000000000000000000000001"
  const tokens = 100
  const transferTx = await provider.Contract.call(
    contract,
    "transfer_call",
    "99999",
    "9999",
    [
      {
        format: ContractArgumentFormat.Hex,
        index: 0,
        value: destination,
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

  const initialOwnerBalance = 1000000

  const owner = await provider.Chain.godAddress()

  ownerBalance = await provider.Contract.readMap(
    contract,
    "b:",
    owner,
    "bigint"
  )
  expect(ownerBalance).toBe(initialOwnerBalance.toString())

  destBalance = await provider.Contract.readMap(
    contract,
    "b:",
    destination,
    "bigint"
  )

  expect(destBalance).toBe("0")
})
