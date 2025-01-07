declare module "newrelic" {
  interface NewRelic {
    setTransactionName(name: string): void;
    addCustomAttribute(name: string, value: string | number | boolean): void;
    noticeError(error: Error | string): void;
  }

  const newrelic: NewRelic;
  export = newrelic;
}
