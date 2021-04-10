#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ServiceLayerStack } from '../lib/service-layer-stack';

const app = new cdk.App();

const suffix = process.env.SUFFIX || 'default'
new ServiceLayerStack(app, `ServiceLayer-${suffix}`, {
  suffix,
});
