import { DynamoDB } from 'aws-sdk';

import { WrappedHandler } from '../types'
import { User } from './types'

const userUnmarshaller = (attributes: DynamoDB.AttributeMap): User => ({
  id: attributes.id.S!,
  firstName: attributes.firstName.S!,
  surname: attributes.surname.S!,
})

const db = new DynamoDB()
const getUsers: WrappedHandler<Array<User>> = async (request) => {
  console.log('get users')
  const result = await db.scan({
    TableName: process.env.USERS_TABLE_NAME!,
  }).promise();

  return result.Items ? result.Items.map(userUnmarshaller) : [];
}

export default getUsers
