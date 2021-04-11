import { Handler } from 'aws-lambda'
import { wrapHandler } from './apiUtils';
import { getUsers } from './users'
import addUser from './users/addUser';

interface HandlerConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: Handler,
}
const handlers: Array<HandlerConfig> = [
  {
    method: 'GET',
    path: '/users',
    handler: wrapHandler(getUsers),
  },
  {
    method: 'POST',
    path: '/users',
    handler: wrapHandler(addUser),
  },
]

const getHandler = (event: any) => {
  const matched = handlers.find(({ method, path }) => event.path === path && event.httpMethod === method)
  return matched ? matched.handler : undefined
}

export const handler: Handler = async (event, context, callback) => {
  console.log('request', JSON.stringify(event, null, 2))
  const matchingHandler = getHandler(event);
  if (matchingHandler) {
    return await matchingHandler(event, context, callback);
  }
  return {
    statusCode: 404,
  }
}
