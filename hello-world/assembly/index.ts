// The entry file of your WebAssembly module.

import { Host, KeyValue } from "idena-sdk-as"

@idenaBindgen
export class HelloWorldContract {

  //stores value by separated key
  someProperty: KeyValue<string, string>

  //stores value as part of 'STATE' key
  classField: string

  // executes while deploying contract
  constructor() {
    this.someProperty = new KeyValue("hello")
    this.someProperty.set("world")
    this.classField = "hello"
  }

  hello(): string {

    Host.emitEvent("Hello world!", [])

    // read state data and return it as a result
    return this.classField + " " + this.someProperty.get("")
  }
}
