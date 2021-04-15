import * as cdk from '@aws-cdk/core'
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class Db extends cdk.Construct {

  public readonly tokenTable;
  public readonly usersTable;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    this.tokenTable = new dynamodb.Table(this, 'TokenTable', {
      partitionKey: {
        name: 'token',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.tokenTable.addGlobalSecondaryIndex({
      indexName: 'username',
      partitionKey: {
        name: 'username',
        type: dynamodb.AttributeType.STRING,
      }
    })

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
