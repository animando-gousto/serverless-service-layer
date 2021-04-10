import * as cdk from '@aws-cdk/core';
import { Api } from './api'

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

    const api = new Api(this, 'Api');
  }
}
