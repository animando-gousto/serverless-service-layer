import * as cdk from '@aws-cdk/core'
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class Db extends cdk.Construct {

  public readonly masterTable;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    this.masterTable = new dynamodb.Table(this, 'MasterTable', {
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.masterTable.addGlobalSecondaryIndex({
      indexName: 'user-token',
      partitionKey: {
        name: 'token',
        type: dynamodb.AttributeType.STRING,
      }
    })

  }
}
