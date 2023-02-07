const fs = require("fs")
const path = require("path")

const {
    ContractRunnerProvider,
    ContractArgumentFormat,
  } = require("idena-sdk-tests")

it('can deploy and call invoke', async () => {
    const incFuncContractPath = path.join('..', 'function', 'build', 'release', 'inc_func.wasm')
    const sumFuncContractPath = path.join('build','release' , 'sum_func.wasm')
    const provider = ContractRunnerProvider.create('http://localhost:3333', '');
    await provider.Chain.generateBlocks(1)
    await provider.Chain.resetTo(2)

    const incFuncContract = fs.readFileSync(incFuncContractPath);
    const incFuncContractEstimateDeployReceipt = await provider.Contract.estimateDeploy("99999", "9999", incFuncContract, Buffer.from(""))
    const incFuncContractDeployTx = await provider.Contract.deploy("99999", "9999", incFuncContract, Buffer.from(""))
    await provider.Chain.generateBlocks(1)

    const incFuncContractDeployReceipt = await provider.Chain.receipt(incFuncContractDeployTx)
    expect(incFuncContractDeployReceipt.success).toBe(true)
    expect(incFuncContractDeployReceipt.contract).toBe(incFuncContractEstimateDeployReceipt.contract)
    const incFuncContractAddress = incFuncContractDeployReceipt.contract

    const sumFuncContract = fs.readFileSync(sumFuncContractPath);

    const sumFuncContractDeployTx = await provider.Contract.deploy("99999", "9999", sumFuncContract,Buffer.from(""), [{
        index: 0,
        format: ContractArgumentFormat.Hex,
        value: incFuncContractAddress,
    }])
    await provider.Chain.generateBlocks(1)

    const sumFuncContractDeployReceipt = await provider.Chain.receipt(sumFuncContractDeployTx)
    expect(sumFuncContractDeployReceipt.success).toBe(true)
    const sumFuncContractAddress = sumFuncContractDeployReceipt.contract

    const sumFuncContractCallInvokeTx = await provider.Contract.call(sumFuncContractAddress, "invoke", "0", "9999", [{
        index: 0,
        format: ContractArgumentFormat.Uint64,
        value: "1",
    },  {
        index: 1,
        format: ContractArgumentFormat.Uint64,
        value: "2",
    }])

    console.log(`sumFuncContractCallInvokeTx: ${sumFuncContractCallInvokeTx}`)
    await provider.Chain.generateBlocks(1)
    const sumFuncContractCallInvokeReceipt = await provider.Chain.receipt(sumFuncContractCallInvokeTx)
    expect(sumFuncContractCallInvokeReceipt.success).toBe(true)


    expect(await provider.Contract.readData(sumFuncContractAddress, "sum", ContractArgumentFormat.Byte)).toBe(4)

    expect(sumFuncContractCallInvokeReceipt.ActionResult.subActionResults[0].success).toBe(true)
    expect(sumFuncContractCallInvokeReceipt.ActionResult.subActionResults[1].success).toBe(true)    

});