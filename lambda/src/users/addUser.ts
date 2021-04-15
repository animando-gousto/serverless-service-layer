import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { WrappedHandler } from '../types'
import { User } from './types'

const db = new DynamoDB()

const addUser: WrappedHandler<User> = async (request) => {
  const user: User = {
    firstName: request.body && request.body.firstName,
    surname: request.body && request.body.surname,
    username: request.body && request.body.username,
  }

  await db.putItem({
    TableName: process.env.MASTER_TABLE_NAME!,
    Item: {
      PK: {
        S: `USER#${user.username}`
      },
      SK: {
        S: `USER#${user.username}`
      },
      firstName: {
        S: user.firstName,
      },
      surname: {
        S: user.surname
      },
      username: {
        S: user.username
      },
    },
  }).promise()

  return {
    body: user
  }
}

export default addUser
