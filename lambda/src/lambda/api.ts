import { Handler } from 'aws-lambda'
import {Lambda } from 'aws-sdk'
import { wrapHandler } from '../lib/api/apiUtils';
import { User } from '../lib/users/types'
import { WrappedHandler } from '../lib/api/types'

const lambda = new Lambda()

interface HandlerConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: Handler,
}

const addUserHandler: WrappedHandler<User> = async ({ body }) => {
  const { Payload } = await lambda.invoke({
      FunctionName: process.env.ADD_USER_FUNCTION_NAME!,
      Payload: JSON.stringify(body)
    }).promise()
  return {
    body: JSON.parse(Payload as string).result,
  }
}

const getUsersHandler: WrappedHandler<Array<User>> = async ({ params }) => {
  const { Payload } = await lambda.invoke({
      FunctionName: process.env.GET_USERS_FUNCTION_NAME!,
      Payload: JSON.stringify({query: params.q})
    }).promise()
  return {
    body: JSON.parse(Payload as string).result,
  }
}

const requestTokenHandler: WrappedHandler<{ token: string }> = async ({ body }) => {
  try {
    const { username, password } = body
    const response = await lambda.invoke({
        FunctionName: process.env.REQUEST_TOKEN_FUNCTION_NAME!,
        Payload: JSON.stringify({ username, password })
      }).promise()

    const res = JSON.parse(response.Payload as string)
    if (res.errorMessage) {
      throw res.errorMessage
    }
    return {
      body: { token: res.token },
      cookies: [
        `token=${res.token}; Domain=animando.co.uk; Secure; SameSite=None`
      ]
    };
  }
  catch (err) {
    console.error(err);
    throw err;
  }
}

const validateTokenHandler: WrappedHandler<{ valid: boolean }> = async ({ params }) => {
  try {
    const { token } = params
    const response = await lambda.invoke({
        FunctionName: process.env.VALIDATE_TOKEN_FUNCTION_NAME!,
        Payload: JSON.stringify({ token })
      }).promise()

    console.log('validateToken response', { response })
    const res = JSON.parse(response.Payload as string)
    if (res.errorMessage) {
      throw res.errorMessage
    }
    return {
      body: { valid: res.valid },
    };
  }
  catch (err) {
    console.error(err);
    throw err;
  }
}
const handlers: Array<HandlerConfig> = [
  {
    method: 'GET',
    path: '/users',
    handler: wrapHandler(getUsersHandler)
  },
  {
    method: 'POST',
    path: '/users',
    handler: wrapHandler(addUserHandler),
  },
  {
    method: 'POST',
    path: '/token',
    handler: wrapHandler(requestTokenHandler),
  },
  {
    method: 'GET',
    path: '/token/validate',
    handler: wrapHandler(validateTokenHandler),
  },
]

const getHandler = (event: any) => {
  const matched = handlers.find(({ method, path }) => event.path === path && event.httpMethod === method)
  return matched ? matched.handler : undefined
}

export const handler: Handler = async (event, context, callback) => {
  const matchingHandler = getHandler(event);
  if (matchingHandler) {
    return await matchingHandler(event, context, callback);
  }
  return {
    statusCode: 404,
  }
}
