import { Handler } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid';
import { DynamoDB } from 'aws-sdk';
import crypto from 'crypto'
import moment from 'moment';

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:MM:SS.sss'

const dynamodb = new DynamoDB()

const deleteExisting = async (username: string) => {
  const existing = await dynamodb.query({
    TableName: process.env.TOKEN_TABLE_NAME!,
    IndexName: 'username',
    KeyConditionExpression: '#username = :username',
    ExpressionAttributeNames: {
      '#username': 'username',
    },
    ExpressionAttributeValues: {
      ':username': {
        S: username,
      },
    },
  }).promise()

  if (existing.Items) {
    console.log('deleting existing', {
      Items: existing.Items
    })
    await dynamodb.batchWriteItem({
      RequestItems: {
        [process.env.TOKEN_TABLE_NAME!]: existing.Items.map(item => ({
            DeleteRequest: {
              Key: {
                'token': {
                  'S': item.token.S
                }
              }
            }
          })
        )
      }
    }).promise()
  }
}
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
  const result = await dynamodb.scan({
    TableName: process.env.USERS_TABLE_NAME!,
    FilterExpression: '#username = :username',
    ExpressionAttributeValues: {
      ':username': {
        S: username
      }
    },
    ExpressionAttributeNames: {
      '#username': 'username',
    }
  }).promise();

  console.log('authentication result', { result });

  const dbPassword = result.Items && result.Items.length === 1 ? result.Items[0].password.S : undefined
  const hash = crypto.createHash('sha256').update(username).update(password).digest('base64');

  return dbPassword === hash
}

export const handler: Handler = async (event, context, callback) => {

  const { username, password } = event
  const authenticated = await authenticate(username, password)
  console.log({ authenticated });
  if (!authenticated) {
    throw "Unauthorized"
  }

  await deleteExisting(username)

  const token = await createToken(username)

  return {
    token,
  }
}
