import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as route53 from '@aws-cdk/aws-route53';
import * as apigw from '@aws-cdk/aws-apigateway'
import * as cert from '@aws-cdk/aws-certificatemanager'
import * as targets from '@aws-cdk/aws-route53-targets';
import { Duration } from '@aws-cdk/core';

interface Props {
  domainName: string,
  suffix: string,
}
export class Api extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    const tokenTable = new dynamodb.Table(this, 'TokenTable', {
      partitionKey: {
        name: 'token',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    tokenTable.addGlobalSecondaryIndex({
      indexName: 'username',
      partitionKey: {
        name: 'username',
        type: dynamodb.AttributeType.STRING,
      }
    })
    const authHandler = new lambda.Function(this, 'AuthLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'auth.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        TOKEN_TABLE_NAME: tokenTable.tableName,
      },
    });
    const apiAuthorizer = new apigw.TokenAuthorizer(this, 'ApiAuthorization', {
      handler: authHandler,
      identitySource: apigw.IdentitySource.header('Authorization'),
      resultsCacheTtl: Duration.minutes(10),
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const getUsersLambda = new lambda.Function(this, 'GetUsersLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'getUsers.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });
    const requestTokenLambda = new lambda.Function(this, 'RequestTokenLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'requestToken.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        TOKEN_TABLE_NAME: tokenTable.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });
    const validateTokenLambda = new lambda.Function(this, 'ValidateTokenLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'validateToken.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        TOKEN_TABLE_NAME: tokenTable.tableName,
      },
    });
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'api.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        GET_USERS_FUNCTION_NAME: getUsersLambda.functionName,
        REQUEST_TOKEN_FUNCTION_NAME: requestTokenLambda.functionName,
        VALIDATE_TOKEN_FUNCTION_NAME: validateTokenLambda.functionName,
        ACCESS_CONTROL_ALLOW_ORIGINS: apigw.Cors.ALL_ORIGINS.join(','),
        ACCESS_CONTROL_ALLOW_HEADERS: apigw.Cors.DEFAULT_HEADERS.join(','),
        ACCESS_CONTROL_ALLOW_METHODS: apigw.Cors.ALL_METHODS.join(','),
      },
    });
    usersTable.grantReadWriteData(apiLambda); // this should go
    usersTable.grantReadData(getUsersLambda);
    usersTable.grantReadData(requestTokenLambda);
    getUsersLambda.grantInvoke(apiLambda);
    requestTokenLambda.grantInvoke(apiLambda);
    validateTokenLambda.grantInvoke(apiLambda);
    tokenTable.grantReadWriteData(requestTokenLambda);
    tokenTable.grantReadData(validateTokenLambda);
    tokenTable.grantReadWriteData(authHandler);

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Api Hosted Zone', {
      hostedZoneId: process.env.HOSTED_ZONE_ID!,
      zoneName: process.env.HOSTED_ZONE_NAME!,
    })
    const certificate = new cert.Certificate(this, 'ApiCertificate', {
      domainName: props.domainName,
      validation: cert.CertificateValidation.fromDns(hostedZone)
    });

    const apigateway = new apigw.LambdaRestApi(this, 'Api', {
      handler: apiLambda,
      proxy: false,
      domainName: {
        domainName: props.domainName,
        certificate,
      },
      restApiName: `ServiceLayer-${props.suffix}`,
      defaultCorsPreflightOptions: {
        allowOrigins: ['http://localhost:3000', `https://${props.suffix}.${process.env.APP_HOST}`],
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
        allowMethods: apigw.Cors.ALL_METHODS,
        disableCache: true,
        allowCredentials: true,
      },
    })
    new route53.ARecord(this, 'CustomDomainAliasRecord', {
      recordName: props.domainName,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(apigateway))
    });
    const token = apigateway.root.addResource('token');
    token.addResource('validate').addMethod('GET');
    token.addMethod('POST');
    const users = apigateway.root.addResource('users');
    users.addMethod('GET', undefined, {
      authorizer: apiAuthorizer
    });
    users.addMethod('POST');

    const user = users.addResource('{users}');
    user.addMethod('GET');
  }
}
