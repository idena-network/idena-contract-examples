import { Address, Balance, Bytes, debug, Host } from "idena-sdk-as";


@idenaBindgen
export class TestCases {
    contract : Address;

    constructor() {

    }

    test (testCase : u32, data : Bytes) : void {
        debug(`run test case = ${testCase}`)
        const deploy_another_contract: u32 = 1;

        switch (testCase) {
            case deploy_another_contract :                
                let arg = new Bytes(20)
                arg[0] = 4
                arg[1] = 3
                arg[2] = 17
    
                Host.createDeployContractPromise(data, [arg], Bytes.fromI8(0),Balance.from(0), 1000000)
                .then("_deployCallback", [], Balance.from(0), 200000);
                break
            default:
                assert(false, "unknown test case");
        }
    }

    _deployCallback() : void {
        let p = Host.promiseResult();
        assert(!p.failed(), "promise result cannot be failed")
    }
}
