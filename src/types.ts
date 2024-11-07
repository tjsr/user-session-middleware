export type uuid = string;
export type uuid5 = uuid;
export type uuid4 = uuid;
export type SnowflakeType = bigint | string;
export type EmailAddress = string;
export type IdNamespace = uuid5;
export type IPAddress = string;
export type UserId = uuid5;
export type SessionId = uuid5;

export type Provides<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, never>>;
export type ProvidesAll<T> = {
  [_K in keyof T]: never;
};
