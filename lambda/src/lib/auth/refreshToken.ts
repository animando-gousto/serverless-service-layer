import { DynamoDB } from 'aws-sdk'
import moment from 'moment'
import { TIMESTAMP_FORMAT } from '../constants/time'

const dynamodb = new DynamoDB()

const refreshToken = async (item: DynamoDB.AttributeMap) => {

  const now = moment().format(TIMESTAMP_FORMAT)
  const expiry = moment().add(2, 'hours').format(TIMESTAMP_FORMAT)
  console.log('refreshing', { now, expiry })
  await dynamodb.putItem({
    TableName: process.env.MASTER_TABLE_NAME!,
    Item: {
      PK: {
        S: item.PK.S
      },
      SK: {
        S: 'TOKEN',
      },
      token: {
        S: item.token.S
      },
      expiry: {
        S: expiry
      },
    }
  }).promise()
}

export default refreshToken
