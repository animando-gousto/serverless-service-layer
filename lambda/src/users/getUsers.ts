import { DynamoDB } from 'aws-sdk';

import { User } from './types'

const userUnmarshaller = (attributes: DynamoDB.AttributeMap): User => ({
  id: attributes.id.S!,
  firstName: attributes.firstName.S!,
  surname: attributes.surname.S!,
  username: attributes.username.S!,
})

const createQuery = () => `contains(#FirstName, :q) or contains(#Surname, :q)`

const db = new DynamoDB()
const getUsers: (query?: string | string[]) => Promise<Array<User>> = async (query) => {
  const result = await db.scan({
    TableName: process.env.USERS_TABLE_NAME!,
    FilterExpression: query && typeof query === 'string' ? createQuery() : undefined,
    ExpressionAttributeValues: query && typeof query === 'string' ? {
      ':q': {
        S: query
      }
    } : undefined,
    ExpressionAttributeNames: query && typeof query === 'string' ? {
      '#FirstName': 'firstName',
      '#Surname': 'surname',
    } : undefined
  }).promise();

  return result.Items ? result.Items.map(userUnmarshaller) : [];
}

export default getUsers
