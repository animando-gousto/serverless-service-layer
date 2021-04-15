import { Handler } from 'aws-lambda'
import { getUsers } from '../lib/users'

export const handler: Handler = async (event, context, callback) => {
  return {
    result: await getUsers(event.query)
  }
}
