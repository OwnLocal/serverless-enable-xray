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
      }
    });
  }

}

module.exports = XrayEnablerPlugin;
