const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  coupon: {
    code: String,
    discount: {
      type: Number,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  
  notes: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ updatedAt: -1 });

// Pre-save middleware
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: 0 // Will be populated from product
    });
  }
  
  return this.save();
};

cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
  
  return this.save();
};

cartSchema.methods.updateQuantity = async function(productId, quantity) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString()
  );
  
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      return this.removeItem(productId);
    }
  }
  
  return this.save();
};

cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.coupon = null;
  return this.save();
};

// Virtuals
cartSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

cartSchema.virtual('total').get(function() {
  let total = this.subtotal;
  
  if (this.coupon) {
    if (this.coupon.discountType === 'percentage') {
      total -= (total * this.coupon.discount) / 100;
    } else if (this.coupon.discountType === 'fixed') {
      total -= this.coupon.discount;
    }
  }
  
  return Math.max(total, 0);
});

cartSchema.virtual('discountAmount').get(function() {
  if (!this.coupon) return 0;
  
  if (this.coupon.discountType === 'percentage') {
    return (this.subtotal * this.coupon.discount) / 100;
  } else {
    return this.coupon.discount;
  }
});

// Static methods
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId })
    .populate('items.product', 'name price images stock isActive');
};

module.exports = mongoose.model('Cart', cartSchema);