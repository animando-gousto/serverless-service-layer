import { Handler } from 'aws-lambda'
import { DynamoDB, } from 'aws-sdk';
import moment from 'moment'

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:MM:SS.sss'

const dynamodb = new DynamoDB()

const checkExpiry = async (item: DynamoDB.AttributeMap) => {
  return moment(item.expiry.S).isAfter(moment())
}

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

    return await checkExpiry(existing.Items[0])
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
