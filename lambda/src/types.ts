export interface Request {
  path: string,
  body?: any,
  params: Record<string, string>,
}
export type WrappedHandler<T> = (request: Request) => Promise<T>
