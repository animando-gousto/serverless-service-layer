import { Handler } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid';
import { DynamoDB } from 'aws-sdk';
import crypto from 'crypto'
import moment from 'moment';
import { TIMESTAMP_FORMAT } from '../lib/constants/time';

const dynamodb = new DynamoDB()

const createToken = async (username: string) => {
  const token = uuidv4()

  await dynamodb.putItem({
    TableName: process.env.MASTER_TABLE_NAME!,
    Item: {
      PK: {
        S: `USER#${username}`,
      },
      SK: {
        S: `TOKEN`,
      },
      token: {
        S: token,
      },
      expiry: {
        S: moment().add(2, 'hours').format(TIMESTAMP_FORMAT),
      },
      username: {
        S: username,
      }
    },
  }).promise();

  return token;
}

const authenticate = async (username: string, password: string) => {
  const result = await dynamodb.query({
    TableName: process.env.MASTER_TABLE_NAME!,
    KeyConditionExpression: 'PK = :userpk and SK = :userpk',
    ExpressionAttributeValues: {
      ':userpk': {
        S: `USER#${username}`,
      },
    },
  }).promise();

  const dbPassword = result.Items && result.Items.length === 1 ? result.Items[0].password.S : undefined
  const hash = crypto.createHash('sha256').update(username).update(password).digest('base64');

  return dbPassword === hash
}

export const handler: Handler = async (event, context, callback) => {

  const { username, password } = event
  const authenticated = await authenticate(username, password)
  if (!authenticated) {
    throw "Unauthorized"
  }

  const token = await createToken(username)

  return {
    token,
  }
}
