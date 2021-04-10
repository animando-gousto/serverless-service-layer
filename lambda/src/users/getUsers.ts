import { DynamoDB } from 'aws-sdk';

import { WrappedHandler } from '../types'

interface User {
  id: string,
  firstName: string,
  surname: string,
}

const userUnmarshaller = (attributes: DynamoDB.AttributeMap) => ({
  id: attributes.id.S,
  firstName: attributes.firstName.S,
  surname: attributes.surname.S,
})

const db = new DynamoDB()
const getUsers: WrappedHandler = async (request) => {
  console.log('get users')
  const result = await db.scan({
    TableName: process.env.USERS_TABLE_NAME || '',
  }).promise();

  return result.Items?.map(userUnmarshaller);
}

export default getUsers
