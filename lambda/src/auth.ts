import { Handler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk';

const db = new DynamoDB()
interface ValidationResult {
  valid: boolean,
}
const validateToken: (token: string) => Promise<ValidationResult> = async (token) => {
  const result = await db.query({
    TableName: process.env.TOKEN_TABLE_NAME!,
    KeyConditionExpression: '#tk = :tk',
    ExpressionAttributeValues: {
      ':tk': {
        S: token
      }
    },
    ExpressionAttributeNames: {
      '#tk': 'token',
    },
  }).promise();

  console.log({
    validationResult: result
  })

  const item = result.Items && result.Items.length ? result.Items[0] : undefined;

  console.log({
    item
  });

  return {
    valid: !!item
  }
}

export const handler: Handler = async (event) => {
  const { authorizationToken : token } = event;
  console.log('validate token', token)
  const validationResult = await validateToken(token)
  if (validationResult.valid) {
    return generatePolicy('user', 'Allow', event.methodArn);
  }
  throw ("Unauthorized");   // Return a 401 Unauthorized response
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
