const mongoose = require('mongoose');

const chatConfigSchema = new mongoose.Schema({
  // Widget Appearance
  widgetPosition: {
    type: String,
    enum: ['bottom-right', 'bottom-left'],
    default: 'bottom-right'
  },
  primaryColor: {
    type: String,
    default: '#0EA5E9' // MedCore BD brand color
  },
  fontFamily: {
    type: String,
    default: 'Plus Jakarta Sans'
  },
  logoUrl: {
    type: String,
    default: '/images/logo.png'
  },
  
  // Messages
  welcomeMessage: {
    en: {
      type: String,
      default: 'Welcome to MedCore BD! How can we help you today?'
    },
    bn: {
      type: String,
      default: 'মেডকোর বিডিতে স্বাগতম! আমরা কিভাবে আপনাকে সাহায্য করতে পারি?'
    }
  },
  offlineMessage: {
    en: {
      type: String,
      default: 'Our team is currently offline. Please leave a message and we\'ll get back to you soon.'
    },
    bn: {
      type: String,
      default: 'আমাদের টিম বর্তমানে অফলাইন। অনুগ্রহ করে একটি বার্তা রেখে যান এবং আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
    }
  },
  awayMessage: {
    en: {
      type: String,
      default: 'The agent is temporarily away. They will respond shortly.'
    },
    bn: {
      type: String,
      default: 'এজেন্ট সাময়িকভাবে দূরে আছেন। তারা শীঘ্রই উত্তর দেবেন।'
    }
  },
  
  // Business Hours
  businessHours: {
    enabled: {
      type: Boolean,
      default: true
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka'
    },
    schedule: {
      monday: { start: '08:00', end: '22:00', enabled: true },
      tuesday: { start: '08:00', end: '22:00', enabled: true },
      wednesday: { start: '08:00', end: '22:00', enabled: true },
      thursday: { start: '08:00', end: '22:00', enabled: true },
      friday: { start: '08:00', end: '22:00', enabled: true },
      saturday: { start: '08:00', end: '22:00', enabled: true },
      sunday: { start: '08:00', end: '22:00', enabled: true }
    }
  },
  
  // Proactive Triggers
  proactiveTriggers: {
    enabled: {
      type: Boolean,
      default: true
    },
    timeOnPage: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 60 // seconds
      },
      message: {
        en: {
          type: String,
          default: 'Need help finding the right medical equipment? Chat with us!'
        },
        bn: {
          type: String,
          default: 'সঠিক মেডিকেল সরঞ্জাম খুঁজে পেতে সাহায্য প্রয়োজন? আমাদের সাথে চ্যাট করুন!'
        }
      }
    },
    cartAbandonment: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 120 // seconds
      },
      message: {
        en: {
          type: String,
          default: 'Need help completing your order? We\'re here to assist!'
        },
        bn: {
          type: String,
          default: 'আপনার অর্ডার সম্পূর্ণ করতে সাহায্য প্রয়োজন? আমরা সাহায্য করতে এখানে আছি!'
        }
      }
    }
  },
  
  // Features
  features: {
    fileUpload: {
      type: Boolean,
      default: true
    },
    emojiPicker: {
      type: Boolean,
      default: true
    },
    typingIndicator: {
      type: Boolean,
      default: true
    },
    readReceipts: {
      type: Boolean,
      default: true
    },
    chatHistory: {
      type: Boolean,
      default: true
    },
    satisfactionSurvey: {
      type: Boolean,
      default: true
    },
    soundNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // Rate Limiting
  rateLimits: {
    conversationsPerHour: {
      type: Number,
      default: 10
    },
    messagesPerMinute: {
      type: Number,
      default: 60
    }
  },
  
  // Session Management
  sessionTimeout: {
    warningAfter: {
      type: Number,
      default: 15 // minutes
    },
    closeAfter: {
      type: Number,
      default: 20 // minutes
    }
  },
  
  // GDPR Compliance
  gdpr: {
    consentRequired: {
      type: Boolean,
      default: true
    },
    consentMessage: {
      en: {
        type: String,
        default: 'We use cookies and collect data to provide you with the best chat experience. By continuing, you agree to our Privacy Policy.'
      },
      bn: {
        type: String,
        default: 'আমরা আপনাকে সেরা চ্যাট অভিজ্ঞতা প্রদান করতে কুকিজ ব্যবহার করি এবং ডেটা সংগ্রহ করি। চালিয়ে যাওয়ার মাধ্যমে, আপনি আমাদের গোপনীয়তা নীতিতে সম্মত হন।'
      }
    },
    dataRetentionDays: {
      type: Number,
      default: 365
    }
  },
  
  // Analytics
  analytics: {
    enabled: {
      type: Boolean,
      default: true
    },
    trackPageViews: {
      type: Boolean,
      default: true
    },
    trackConversions: {
      type: Boolean,
      default: true
    }
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to get active configuration
chatConfigSchema.statics.getActiveConfig = async function() {
  let config = await this.findOne({ isActive: true });
  
  // Create default config if none exists
  if (!config) {
    config = await this.create({ isActive: true });
  }
  
  return config;
};

// Method to check if currently within business hours
chatConfigSchema.methods.isWithinBusinessHours = function() {
  if (!this.businessHours.enabled) {
    return true; // Always available if business hours not enabled
  }
  
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const schedule = this.businessHours.schedule[dayOfWeek];
  
  if (!schedule.enabled) {
    return false;
  }
  
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  return currentTime >= schedule.start && currentTime <= schedule.end;
};

module.exports = mongoose.model('ChatConfig', chatConfigSchema);
