import { DynamoDB } from 'aws-sdk';

import { WrappedHandler } from '../types'
import { User } from './types'

const userUnmarshaller = (attributes: DynamoDB.AttributeMap): User => ({
  id: attributes.id.S!,
  firstName: attributes.firstName.S!,
  surname: attributes.surname.S!,
})

const createQuery = () => `contains(#FirstName, :q) or contains(#Surname, :q)`

const db = new DynamoDB()
const getUsers: WrappedHandler<Array<User>> = async (request) => {
  const result = await db.scan({
    TableName: process.env.USERS_TABLE_NAME!,
    FilterExpression: request.params.q && typeof request.params.q === 'string' ? createQuery() : undefined,
    ExpressionAttributeValues: request.params.q && typeof request.params.q === 'string' ? {
      ':q': {
        S: request.params.q
      }
    } : undefined,
    ExpressionAttributeNames: request.params.q && typeof request.params.q === 'string' ? {
      '#FirstName': 'firstName',
      '#Surname': 'surname',
    } : undefined
  }).promise();

  return result.Items ? result.Items.map(userUnmarshaller) : [];
}

export default getUsers
