import { Handler } from 'aws-lambda'
import { DynamoDB, } from 'aws-sdk';
import checkTokenExpiry from '../lib/auth/checkTokenExpiry'

const dynamodb = new DynamoDB()

const validateToken = async (token: string): Promise<boolean> => {
  const existing = await dynamodb.query({
    TableName: process.env.MASTER_TABLE_NAME!,
    IndexName: 'user-token',
    KeyConditionExpression: '#token = :token',
    ExpressionAttributeNames: {
      '#token': 'token',
    },
    ExpressionAttributeValues: {
      ':token': {
        S: token,
      },
    },
  }).promise()

  if (existing.Items && existing.Items.length) {
    console.log('found existing', {
      Items: existing.Items
    })

    return await checkTokenExpiry(existing.Items[0])
  }
  return false
}

export const handler: Handler = async (event, context, callback) => {
  const { token } = event
  const valid = await validateToken(token)

  return {
    valid,
  }
}
