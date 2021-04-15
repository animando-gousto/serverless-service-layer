import * as cdk from '@aws-cdk/core';
import { Api } from './api'
import { Db } from './db';
import { Lambda } from './lambda';
interface StackProps extends cdk.StackProps {
  suffix: string,
}

export class ServiceLayerStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: StackProps) {
    super(scope, id, props);

    new cdk.CfnParameter(this, 'bucketPrefix', {
      type: 'String',
      description: 'Unique prefix of the s3 bucket',
    })

    const db = new Db(this, 'Database')
    const lambdas = new Lambda(this, 'Lambda', {
      db,
    })

    const api = new Api(this, 'Api', {
      domainName: `${props.suffix}.${process.env.HOSTED_ZONE_NAME}`,
      suffix: props.suffix,
      db,
      lambdas,
    });
  }
}
