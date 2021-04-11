import { Handler } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid';
import { DynamoDB } from 'aws-sdk';
import moment = require('moment');

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:MM:SS.sss'

const dynamodb = new DynamoDB()

const createToken = async (username: string) => {
  const token = uuidv4()

  await dynamodb.putItem({
    TableName: process.env.TOKEN_TABLE_NAME!,
    Item: {
      username: {
        S: username,
      },
      token: {
        S: token,
      },
      expiry: {
        S: moment().add(2, 'hours').format(TIMESTAMP_FORMAT)
      }
    },
  }).promise();

  return token;
}

const authenticate = async (username: string, password: string) => {
  return true
}

export const handler: Handler = async (event, context, callback) => {

  const { username, password } = event
  const authenticated = await authenticate(username, password)

  const token = await createToken(username)

  return {
    token,
  }

}
