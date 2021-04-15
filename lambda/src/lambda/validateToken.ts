import { Handler } from 'aws-lambda'
import { DynamoDB, } from 'aws-sdk';
import checkAndRefreshToken from '../lib/auth/checkAndRefreshToken';
import checkTokenExpiry from '../lib/auth/checkTokenExpiry'
import refreshToken from '../lib/auth/refreshToken'

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

  return await checkAndRefreshToken(existing)
}

export const handler: Handler = async (event, context, callback) => {
  const { token } = event
  const valid = await validateToken(token)

  return {
    valid,
  }
}
