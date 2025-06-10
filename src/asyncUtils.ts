export class Barrier<Data> {
  private _promise: Promise<Data | undefined>;
  private _reject!: (err: any) => void;
  private _resolve!: (d?: Data | undefined) => void;

  constructor() {
    this._promise = new Promise<Data | undefined>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  async reject(err?: any): Promise<Data | undefined> {
    this._reject(err);
    return this._promise;
  }

  async release(data?: Data): Promise<Data | undefined> {
    this._resolve(data);
    return this._promise;
  }

  async wait(): Promise<Data | undefined> {
    return this._promise;
  }
}
