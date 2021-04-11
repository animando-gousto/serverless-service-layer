
export type Params = Record<string, string | Array<string>>


export interface Request {
  path: string,
  body?: any,
  params: Params,
}
export type WrappedHandler<T> = (request: Request) => Promise<T>
