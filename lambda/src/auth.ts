import { Handler } from 'aws-lambda'

export const handler: Handler = async (event) => {
  const { authorizationToken : token } = event;
  switch (token) {
    case 'allow':
      return generatePolicy('user', 'Allow', event.methodArn);
      break;
    case 'deny':
      return generatePolicy('user', 'Deny', event.methodArn);
      break;
    case 'unauthorized':
      throw ("Unauthorized");   // Return a 401 Unauthorized response
      break;
    default:
      throw("Error: Invalid token"); // Return a 500 Invalid token response
  }
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
