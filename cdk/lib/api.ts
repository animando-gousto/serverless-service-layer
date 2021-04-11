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

    const authHandler = new lambda.Function(this, 'AuthLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'auth.handler',
      code: lambda.Code.fromAsset('../lambda/build'),
    });
    const apiAuthorizer = new apigw.TokenAuthorizer(this, 'ApiAuthorization', {
      handler: authHandler,
      identitySource: apigw.IdentitySource.header('Authorization'),
      resultsCacheTtl: Duration.minutes(1),
    });

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
        USERS_TABLE_NAME: usersTable.tableName,
        ACCESS_CONTROL_ALLOW_ORIGINS: apigw.Cors.ALL_ORIGINS.join(','),
        ACCESS_CONTROL_ALLOW_HEADERS: apigw.Cors.DEFAULT_HEADERS.join(','),
        ACCESS_CONTROL_ALLOW_METHODS: apigw.Cors.ALL_METHODS.join(','),
      },
    });
    usersTable.grantReadWriteData(handler);

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Api Hosted Zone', {
      hostedZoneId: process.env.HOSTED_ZONE_ID || '',
      zoneName: process.env.HOSTED_ZONE_NAME || '',
    })
    const certificate = new cert.Certificate(this, 'ApiCertificate', {
      domainName: props.domainName,
      validation: cert.CertificateValidation.fromDns(hostedZone)
    });

    const apigateway = new apigw.LambdaRestApi(this, 'Api', {
      handler: handler,
      proxy: false,
      domainName: {
        domainName: props.domainName,
        certificate,
      },
      restApiName: `ServiceLayer-${props.suffix}`,
      defaultCorsPreflightOptions: {
        allowOrigins: ['http://localhost:3000', `https://*.${process.env.APP_HOST}`],
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
        allowMethods: apigw.Cors.ALL_METHODS,
        disableCache: true,
      },
    })
    new route53.ARecord(this, 'CustomDomainAliasRecord', {
      recordName: props.domainName,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(apigateway))
    });
    const users = apigateway.root.addResource('users');
    users.addMethod('GET', undefined, {
      authorizer: apiAuthorizer
    });
    users.addMethod('POST');

    const user = users.addResource('{users}');
    user.addMethod('GET');
  }
}
