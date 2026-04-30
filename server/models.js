import mongoose from 'mongoose';

const CoverageSchema = new mongoose.Schema(
  {
    coverageId: String,
    product: String,
    coverageName: String,
    limit: Number,
    deductible: Number,
    rateModifier: Number,
    premium: Number
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    product: String,
    state: String
  },
  { _id: false }
);

const EndorsementSchema = new mongoose.Schema(
  {
    types: [String],
    documents: [
      {
        name: String,
        uploadedAt: Date
      }
    ]
  },
  { _id: false }
);

const PremiumSchema = new mongoose.Schema(
  {
    currency: String,
    subtotal: Number,
    productSurcharge: Number,
    endorsementSurcharge: Number,
    totalPremium: Number,
    breakdown: [CoverageSchema]
  },
  { _id: false }
);

const PolicySchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, index: true },
    policyNumber: { type: String, index: true },
    status: { type: String, enum: ['DRAFT', 'QUOTED', 'BOUND'], default: 'DRAFT', index: true },
    effectiveDate: String,
    expiryDate: String,
    productTypes: [String],
    producerNumber: String,
    insuredName: { type: String, index: true },
    primaryContact: String,
    locations: [LocationSchema],
    coverages: mongoose.Schema.Types.Mixed,
    endorsements: EndorsementSchema,
    premium: PremiumSchema
  },
  { timestamps: true }
);

const BusinessRuleSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    name: String,
    condition: String,
    errorMessage: String,
    active: Boolean
  },
  { timestamps: true }
);

export function getModels() {
  return {
    Policy: mongoose.models.Policy || mongoose.model('Policy', PolicySchema),
    BusinessRule: mongoose.models.BusinessRule || mongoose.model('BusinessRule', BusinessRuleSchema)
  };
}
