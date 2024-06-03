/* eslint-disable @typescript-eslint/no-explicit-any */
export class Barrier<Data> {
  private _promise: Promise<Data|undefined>;
  // eslint-disable-next-line no-unused-vars
  private _resolve!: (d?: Data | undefined) => void;
  // eslint-disable-next-line no-unused-vars
  private _reject!: (err: any) => void;

  constructor() {
    this._promise = new Promise<Data|undefined>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  async wait(): Promise<Data | undefined> {
    return this._promise;
  }

  async reject(err?: any): Promise<Data|undefined> {
    this._reject(err);
    return this._promise;
  }

  async release(data?: Data): Promise<Data|undefined> {
    this._resolve(data);
    return this._promise;
  }
};
