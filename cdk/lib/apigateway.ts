import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as route53 from '@aws-cdk/aws-route53';
import * as apigw from '@aws-cdk/aws-apigateway'
import * as cert from '@aws-cdk/aws-certificatemanager'
import * as targets from '@aws-cdk/aws-route53-targets';
import { Duration } from '@aws-cdk/core';
import { Db } from './db';
import { Lambda } from './lambda';

interface Props {
  domainName: string,
  suffix: string,
  lambdas: Lambda,
}
export class ApiGateway extends cdk.Construct {

  public readonly apiProxy

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Api Hosted Zone', {
      hostedZoneId: process.env.HOSTED_ZONE_ID!,
      zoneName: process.env.HOSTED_ZONE_NAME!,
    })
    const certificate = new cert.Certificate(this, 'ApiCertificate', {
      domainName: props.domainName,
      validation: cert.CertificateValidation.fromDns(hostedZone)
    });

    this.apiProxy = new apigw.LambdaRestApi(this, 'Api', {
      handler: props.lambdas.apiLambda,
      proxy: false,
      domainName: {
        domainName: `migration.${props.domainName}`,
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
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(this.apiProxy))
    });
  }
}
