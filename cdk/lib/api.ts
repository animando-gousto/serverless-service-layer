import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

import * as apigw from '@aws-cdk/aws-apigateway'

export class Api extends cdk.Construct {

  public readonly endpointUrl: string;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)


    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const handler = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'api.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName
      },
    });
    usersTable.grantReadWriteData(handler);

    const apigateway = new apigw.LambdaRestApi(this, 'Api', {
      handler: handler,
      proxy: false,
    })
    const users = apigateway.root.addResource('users');
    users.addMethod('GET');
    users.addMethod('POST');

    const user = users.addResource('{users}');
    user.addMethod('GET');

    this.endpointUrl = apigateway.url
  }
}
