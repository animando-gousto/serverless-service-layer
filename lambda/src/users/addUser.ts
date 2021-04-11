import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { WrappedHandler } from '../types'
import { User } from './types'

const db = new DynamoDB()

const addUser: WrappedHandler<User> = async (request) => {
  console.log({ request })
  const user: User = {
    firstName: request.body && request.body.firstName,
    surname: request.body && request.body.surname,
    id: uuidv4(),
  }

  await db.putItem({
    TableName: process.env.USERS_TABLE_NAME!,
    Item: {
      id: {
        S: user.id,
      },
      firstName: {
        S: user.firstName,
      },
      surname: {
        S: user.surname
      },
    },
  }).promise()

  return user
}

export default addUser
