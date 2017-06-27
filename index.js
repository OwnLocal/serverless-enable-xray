'use strict';

class XrayEnablerPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'after:package:compileFunctions': this.beforeDeploy.bind(this),
    };
  }

  beforeDeploy() {
    var resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;

    // Add a WaitCondition resource to ensure role has time to update before trying to deploy the lambdas
    resources.XrayWaitHandle = { Type: 'AWS::CloudFormation::WaitConditionHandle' };
    resources.XrayWaitCondition = {
      Type: 'AWS::CloudFormation::WaitCondition',
      DependsOn: [ 'IamRoleLambdaExecution' ],
      Properties: {
        Handle: { Ref: 'XrayWaitHandle' },
        Timeout: 10,
        Count: 0,
      },
    };

    // Allow lambdas to write X-Ray traces
    resources.IamRoleLambdaExecution.Properties.Policies[0].PolicyDocument.Statement.push({
      Effect: 'Allow',
      Action: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
      ],
      Resource: ['*'],
    });

    // Enable X-Ray on each lambda
    Object.keys(resources).forEach((name) => {
      if (resources[name].Type === 'AWS::Lambda::Function') {
        resources[name].Properties.TracingConfig = {
          Mode: 'Active',
        };
        resources[name].DependsOn.push('XrayWaitCondition');
      }
    });
  }

}

module.exports = XrayEnablerPlugin;
