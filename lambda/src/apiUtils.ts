import { Handler } from 'aws-lambda'

import { Request, WrappedHandler, Params } from './types'

const parseParams = (multiValueParams?: Record<string, Array<string>>): Params => {
  if (!multiValueParams) {
    return {}
  }
  const keys = Object.keys(multiValueParams)
  return keys.reduce<Params>((acc, key) => ({
    ...acc,
    [key]: multiValueParams[key].length === 1 ? multiValueParams[key][0] : multiValueParams[key],
  }), {})
}

export const wrapHandler: <T> (handler: WrappedHandler<T>) => Handler = (handler) => async (event, context, callback) => {
  try {
    console.log({ event })
    const request: Request = {
      path: event.path,
      params: parseParams(event.multiValueQueryStringParameters),
      body: event.body ? JSON.parse(event.body) : undefined,
    }
    const result = await handler(request)
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': process.env.ACCESS_CONTROL_ALLOW_ORIGINS!,
        'access-control-allow-headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS!,
        'access-control-allow-methods': process.env.ACCESS_CONTROL_ALLOW_METHODS!,
      },
      body: result ? JSON.stringify(result) : undefined,
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': process.env.ACCESS_CONTROL_ALLOW_ORIGINS!,
        'access-control-allow-headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS!,
        'access-control-allow-methods': process.env.ACCESS_CONTROL_ALLOW_METHODS!,
      },
      body: JSON.stringify({ error: true, message: e.toString() }),
    }
  }
}
