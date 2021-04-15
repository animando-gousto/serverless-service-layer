import { DynamoDB } from 'aws-sdk';

import { User } from './types'

const userUnmarshaller = (attributes: DynamoDB.AttributeMap): User => ({
  firstName: attributes.firstName.S!,
  surname: attributes.surname.S!,
  username: attributes.username.S!,
})

const createQuery = (query?: string) => `begins_with(SK, :USER)${query ? ` and (contains(firstName, :q) or contains(surname, :q))` : ''}`

const db = new DynamoDB()
const getUsers: (query?: string | string[]) => Promise<Array<User>> = async (query) => {
  const result = await db.scan({
    TableName: process.env.MASTER_TABLE_NAME!,
    FilterExpression: createQuery(typeof query === 'string' ? query : undefined),
    ExpressionAttributeValues: {
      ':USER': {
        S: 'USER#',
      },
      ...query && typeof query === 'string' ? {
        ':q': {
          S: query
        },
      } : undefined,
    }
  }).promise();

  return result.Items ? result.Items.map(userUnmarshaller) : [];
}

export default getUsers
