import mongoose from 'mongoose';
import { defaultBusinessRules } from '../shared/ratingConfig.js';
import { getModels } from './models.js';

let mongoReady = false;
let memoryPolicies = [];
let memoryRules = defaultBusinessRules.map((rule) => ({ ...rule }));

export async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    return { provider: 'memory', connected: false };
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500
    });
    mongoReady = true;
    await seedRules();
    return { provider: 'mongodb', connected: true };
  } catch (error) {
    console.warn(`MongoDB unavailable, using memory store: ${error.message}`);
    mongoReady = false;
    return { provider: 'memory', connected: false, error: error.message };
  }
}

export function databaseStatus() {
  return {
    provider: mongoReady ? 'mongodb' : 'memory',
    connected: mongoReady
  };
}

async function seedRules() {
  if (!mongoReady) return;
  const { BusinessRule } = getModels();
  for (const rule of defaultBusinessRules) {
    await BusinessRule.updateOne({ id: rule.id }, { $setOnInsert: rule }, { upsert: true });
  }
}

export async function listRules() {
  if (mongoReady) {
    const { BusinessRule } = getModels();
    return BusinessRule.find({}).sort({ createdAt: 1 }).lean();
  }
  return memoryRules;
}

export async function updateRule(ruleId, updates) {
  if (mongoReady) {
    const { BusinessRule } = getModels();
    return BusinessRule.findOneAndUpdate({ id: ruleId }, updates, { new: true }).lean();
  }

  memoryRules = memoryRules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule));
  return memoryRules.find((rule) => rule.id === ruleId);
}

export async function createPolicy(policy) {
  if (mongoReady) {
    const { Policy } = getModels();
    const created = await Policy.create(policy);
    return created.toObject();
  }

  const created = {
    ...policy,
    _id: `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryPolicies.unshift(created);
  return created;
}

export async function updatePolicyByQuote(quoteNumber, updates) {
  if (mongoReady) {
    const { Policy } = getModels();
    return Policy.findOneAndUpdate({ quoteNumber }, updates, { new: true }).lean();
  }

  memoryPolicies = memoryPolicies.map((policy) =>
    policy.quoteNumber === quoteNumber ? { ...policy, ...updates, updatedAt: new Date().toISOString() } : policy
  );
  return memoryPolicies.find((policy) => policy.quoteNumber === quoteNumber);
}

export async function searchPolicies(query) {
  const trimmed = query?.trim();
  if (!trimmed) return [];

  const matcher = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (mongoReady) {
    const { Policy } = getModels();
    return Policy.find({
      $or: [{ quoteNumber: matcher }, { policyNumber: matcher }, { insuredName: matcher }]
    })
      .sort({ updatedAt: -1 })
      .lean();
  }

  return memoryPolicies.filter(
    (policy) =>
      matcher.test(policy.quoteNumber || '') ||
      matcher.test(policy.policyNumber || '') ||
      matcher.test(policy.insuredName || '')
  );
}

export async function findPolicyByQuote(quoteNumber) {
  if (mongoReady) {
    const { Policy } = getModels();
    return Policy.findOne({ quoteNumber }).lean();
  }
  return memoryPolicies.find((policy) => policy.quoteNumber === quoteNumber);
}

export async function resetMemoryStore() {
  if (mongoReady) return;
  memoryPolicies = [];
  memoryRules = defaultBusinessRules.map((rule) => ({ ...rule }));
}
