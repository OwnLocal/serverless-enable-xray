'use strict';

class XrayEnablerPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'after:package:compileFunctions': this.beforeDeploy.bind(this),
    };
  }

  beforeDeploy() {
    var resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
    Object.keys(resources).forEach((name) => {
      var type = resources[name].Type;
      if (type === 'AWS::Lambda::Function') {
        resources[name].Properties.TracingConfig = {
          Mode: 'Active',
        };
      }
    });
  }

}

module.exports = XrayEnablerPlugin;
