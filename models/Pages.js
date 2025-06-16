const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Page title is required"],
      unique: true, // Ensures no duplicate page types
      trim: true, // Removes whitespace
    },
    description: {
      type: String,
      required: [true, "Page content is required"],
      minlength: [50, "Content should be at least 50 characters long"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      enum: ["terms", "policy", "about", "faq"], // Added more common page types
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "SEO description should not exceed 160 characters"],
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

// Middleware to generate slug before saving
PageSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

// Index for better query performance
PageSchema.index({ title: 1, slug: 1 });

module.exports = mongoose.model("Page", PageSchema);
