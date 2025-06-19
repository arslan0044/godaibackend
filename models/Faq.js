const mongooes = require("mongoose");
const FaqSchema = new mongooes.Schema(
  {
    title: {
      type: String,
      required: [true, "Question is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for better query performance
FaqSchema.index({ title: 1 });
FaqSchema.index({ isActive: 1 });
exports.Faq = mongooes.model("Faq", FaqSchema);
exports.FaqSchema = FaqSchema;
