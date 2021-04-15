import { Handler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk';
import moment from 'moment';

const db = new DynamoDB()
const checkExpiry = async (item: DynamoDB.AttributeMap) => {
  return moment(item.expiry.S).isAfter(moment())
}

const validateToken: (token: string) => Promise<boolean> = async (token) => {
  const existing = await db.query({
    TableName: process.env.MASTER_TABLE_NAME!,
    IndexName: 'user-token',
    KeyConditionExpression: '#token = :token',
    ExpressionAttributeValues: {
      ':token': {
        S: token
      }
    },
    ExpressionAttributeNames: {
      '#token': 'token',
    },
  }).promise();

  if (existing.Items && existing.Items.length) {
    console.log('found existing', {
      Items: existing.Items
    })

    return await checkExpiry(existing.Items[0])
  }
  return false
}

export const handler: Handler = async (event) => {
  const { authorizationToken : token } = event;
  console.log('validate token', token)
  const validationResult = await validateToken(token)
  if (validationResult) {
    return generatePolicy('user', 'Allow', event.methodArn);
  }
  throw "Unauthorized";   // Return a 401 Unauthorized response
}

const generatePolicy = (principalId: string, effect: string, resource: string) => {
  const authResponse: any = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument: any = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne: any = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  // Optional output with custom properties of the String, Number or Boolean type.
  authResponse.context = {
    "stringKey": "stringval",
    "numberKey": 123,
    "booleanKey": true
  };

  return authResponse;
}
