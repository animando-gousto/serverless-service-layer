import { DynamoDB } from 'aws-sdk';
import { CreateUser, User } from './types'
import hashPassword from '../lib/auth/hashPassword'

const db = new DynamoDB()

const addUser: (user: CreateUser) => Promise<User> = async (user: CreateUser) => {

  const { password: rawPassword, ...restUser } = user

  const password = hashPassword(user.username, rawPassword)

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
      password: {
        S: password
      },
    },
  }).promise()

  return restUser
}

export default addUser
