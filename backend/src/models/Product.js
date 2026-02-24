const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other']
  },
  brand: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  images: [{
    url: String,
    publicId: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);