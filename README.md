# idena-contract-examples [WIP]
## Note: Contract examples are not ready for production use. Code may be bugged. The purpose of this repo is to show how to write and test contracts with idena-sdk-as.


## How to build

Choose example, install dependencies  and build wasm file
```sh
cd hello-world
yarn install
yarn asb
```

## How to test

Run node [simulator](https://github.com/idena-network/idena-contract-runner)
```sh
./idena-contract-runner-linux-0.0.2
```
Execute tests

```sh
yarn test
```
