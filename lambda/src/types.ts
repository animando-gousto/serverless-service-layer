export interface Request {
  path: string,
}
export type WrappedHandler = (request: Request) => Promise<any>
