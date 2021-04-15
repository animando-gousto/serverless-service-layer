
export type Params = Record<string, string | Array<string>>


export interface Request {
  path: string,
  body?: any,
  params: Params,
}

export interface Response<T> {
  body: T,
  headers?: Record<string, string>,
  cookies?: Array<string>,
}

export type WrappedHandler<T> = (request: Request) => Promise<Response<T>>
