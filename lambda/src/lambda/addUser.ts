import { Handler } from 'aws-lambda'
import { addUser } from '../lib/users'

export const handler: Handler = async (event, context, callback) => {
  return {
    result: await addUser(event)
  }
}
