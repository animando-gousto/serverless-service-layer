import { Handler } from 'aws-lambda'

import { Request, WrappedHandler } from './types'

export const wrapHandler: (handler: WrappedHandler) => Handler = (handler) => async (event, context, callback) => {
  try {
    const request: Request = {
      path: event.path
    }
    const result = await handler(request)
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': process.env.ACCESS_CONTROL_ALLOW_ORIGINS || '',
        'access-control-allow-headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS || '',
        'access-control-allow-methods': process.env.ACCESS_CONTROL_ALLOW_METHODS || '',
      },
      body: JSON.stringify(result),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': process.env.ACCESS_CONTROL_ALLOW_ORIGINS || '',
        'access-control-allow-headers': process.env.ACCESS_CONTROL_ALLOW_HEADERS || '',
        'access-control-allow-methods': process.env.ACCESS_CONTROL_ALLOW_METHODS || '',
      },
      body: JSON.stringify({ error: true, message: e.toString() }),
    }
  }
}
