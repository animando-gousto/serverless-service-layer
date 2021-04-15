import { Handler } from 'aws-lambda'

import { Request, WrappedHandler, Params } from './types'

const getErrorStatus = (e: any): number => {
  switch (e) {
    case "Unauthorized":
      return 401
    default:
      return 500
  }
}

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
  console.log({
    event,
  })
  try {
    const request: Request = {
      path: event.path,
      params: parseParams(event.multiValueQueryStringParameters),
      body: event.body ? JSON.parse(event.body) : undefined,
    }
    const { body, headers, cookies } = await handler(request)
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'content-type': 'application/json',
        'access-control-allow-origin': event.headers.origin,
        'access-control-allow-headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS!,
        'access-control-allow-methods': event.headers.httpMethod,
        'access-control-allow-credentials': 'true',

      },
      ...(cookies ? ({
        multiValueHeaders: {
          'Set-Cookie': cookies,
        },
      }) : undefined),
      body: body ? JSON.stringify(body) : undefined,
    }
  } catch (e) {
    console.log(e)
    return {
      statusCode: getErrorStatus(e),
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': event.headers.origin,
        'access-control-allow-headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS!,
        'access-control-allow-methods': event.headers.httpMethod,
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify({ error: true, message: e.toString() }),
    }
  }
}
