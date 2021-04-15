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
import { ApiGateway } from './apigateway';

interface Props {
  domainName: string,
  suffix: string,
  db: Db,
  lambdas: Lambda,
}
export class Api extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    const apigw = new ApiGateway(this, 'ApiGateway', {
      lambdas: props.lambdas,
      suffix: props.suffix,
      domainName: props.domainName,
    })

    const token = apigw.apiProxy.root.addResource('token');
    token.addResource('validate').addMethod('GET');
    token.addMethod('POST');
    const users = apigw.apiProxy.root.addResource('users');
    users.addMethod('GET', undefined, {
      authorizer: props.lambdas.apiAuthorizer
    });
    users.addMethod('POST');

    const user = users.addResource('{users}');
    user.addMethod('GET');
  }
}
