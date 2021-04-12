#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Tags } from '@aws-cdk/core';
import { ServiceLayerStack } from '../lib/service-layer-stack';

const app = new cdk.App();

const suffix = process.env.SUFFIX!
const stack = new ServiceLayerStack(app, `ServiceLayer-${suffix}`, {
  suffix,
});

Tags.of(stack).add('env-suffix', suffix)
