import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as route53 from '@aws-cdk/aws-route53';
import * as apigw from '@aws-cdk/aws-apigateway'
import * as cert from '@aws-cdk/aws-certificatemanager'
import * as targets from '@aws-cdk/aws-route53-targets';
import { Duration } from '@aws-cdk/core';
import { Db } from './db';

interface Props {
  db: Db,
}
export class Lambda extends cdk.Construct {

  public readonly authHandler
  public readonly apiAuthorizer
  public readonly getUsersLambda
  public readonly requestTokenLambda
  public readonly validateTokenLambda
  public readonly apiLambda

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    this.authHandler = new lambda.Function(this, 'AuthLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'auth.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        TOKEN_TABLE_NAME: props.db.tokenTable.tableName,
      },
    });
    this.apiAuthorizer = new apigw.TokenAuthorizer(this, 'ApiAuthorization', {
      handler: this.authHandler,
      identitySource: apigw.IdentitySource.header('Authorization'),
      resultsCacheTtl: Duration.minutes(10),
    });

    this.getUsersLambda = new lambda.Function(this, 'GetUsersLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'getUsers.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        USERS_TABLE_NAME: props.db.usersTable.tableName,
      },
    });
    this.requestTokenLambda = new lambda.Function(this, 'RequestTokenLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'requestToken.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        TOKEN_TABLE_NAME: props.db.tokenTable.tableName,
        USERS_TABLE_NAME: props.db.usersTable.tableName,
      },
    });
    this.validateTokenLambda = new lambda.Function(this, 'ValidateTokenLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'validateToken.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        TOKEN_TABLE_NAME: props.db.tokenTable.tableName,
      },
    });
    this.apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'api.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        USERS_TABLE_NAME: props.db.usersTable.tableName,
        GET_USERS_FUNCTION_NAME: this.getUsersLambda.functionName,
        REQUEST_TOKEN_FUNCTION_NAME: this.requestTokenLambda.functionName,
        VALIDATE_TOKEN_FUNCTION_NAME: this.validateTokenLambda.functionName,
        ACCESS_CONTROL_ALLOW_ORIGINS: apigw.Cors.ALL_ORIGINS.join(','),
        ACCESS_CONTROL_ALLOW_HEADERS: apigw.Cors.DEFAULT_HEADERS.join(','),
        ACCESS_CONTROL_ALLOW_METHODS: apigw.Cors.ALL_METHODS.join(','),
      },
    });
    props.db.usersTable.grantReadWriteData(this.apiLambda); // this should go
    props.db.usersTable.grantReadData(this.getUsersLambda);
    props.db.usersTable.grantReadData(this.requestTokenLambda);
    this.getUsersLambda.grantInvoke(this.apiLambda);
    this.requestTokenLambda.grantInvoke(this.apiLambda);
    this.validateTokenLambda.grantInvoke(this.apiLambda);
    props.db.tokenTable.grantReadWriteData(this.requestTokenLambda);
    props.db.tokenTable.grantReadData(this.validateTokenLambda);
    props.db.tokenTable.grantReadWriteData(this.authHandler);
  }
}
