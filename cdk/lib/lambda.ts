import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway'
import { Db } from './db';

interface Props {
  db: Db,
}
export class Lambda extends cdk.Construct {

  public readonly authHandler
  public readonly getUsersLambda
  public readonly addUserLambda
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
        MASTER_TABLE_NAME: props.db.masterTable.tableName,
      },
    });

    this.getUsersLambda = new lambda.Function(this, 'GetUsersLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'getUsers.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        MASTER_TABLE_NAME: props.db.masterTable.tableName,
      },
    });
    this.addUserLambda = new lambda.Function(this, 'AddUserLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'addUser.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        MASTER_TABLE_NAME: props.db.masterTable.tableName,
      },
    });
    this.requestTokenLambda = new lambda.Function(this, 'RequestTokenLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'requestToken.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        MASTER_TABLE_NAME: props.db.masterTable.tableName,
      },
    });
    this.validateTokenLambda = new lambda.Function(this, 'ValidateTokenLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'validateToken.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        MASTER_TABLE_NAME: props.db.masterTable.tableName,
      },
    });
    this.apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'api.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        MASTER_TABLE_NAME: props.db.masterTable.tableName,
        ADD_USER_FUNCTION_NAME: this.addUserLambda.functionName,
        GET_USERS_FUNCTION_NAME: this.getUsersLambda.functionName,
        REQUEST_TOKEN_FUNCTION_NAME: this.requestTokenLambda.functionName,
        VALIDATE_TOKEN_FUNCTION_NAME: this.validateTokenLambda.functionName,
        ACCESS_CONTROL_ALLOW_ORIGINS: apigw.Cors.ALL_ORIGINS.join(','),
        ACCESS_CONTROL_ALLOW_HEADERS: apigw.Cors.DEFAULT_HEADERS.join(','),
        ACCESS_CONTROL_ALLOW_METHODS: apigw.Cors.ALL_METHODS.join(','),
      },
    });
    this.getUsersLambda.grantInvoke(this.apiLambda);
    this.requestTokenLambda.grantInvoke(this.apiLambda);
    this.validateTokenLambda.grantInvoke(this.apiLambda);
    this.addUserLambda.grantInvoke(this.apiLambda);

    props.db.masterTable.grantReadData(this.authHandler);
    props.db.masterTable.grantReadWriteData(this.requestTokenLambda);
    props.db.masterTable.grantReadData(this.validateTokenLambda);
    props.db.masterTable.grantReadData(this.getUsersLambda);
    props.db.masterTable.grantReadWriteData(this.addUserLambda);
  }
}
