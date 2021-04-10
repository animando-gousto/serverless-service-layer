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
      },
      body: JSON.stringify(result),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ error: true, message: e.toString() }),
    }
  }
}
