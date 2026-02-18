const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentification
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String },
  phoneNumber: { type: String, unique: true, sparse: true },
  
  // OAuth IDs
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  appleId: { type: String, unique: true, sparse: true },
  
  // Profil de base
  firstName: String,
  lastName: String,
  displayName: String,
  birthDate: Date,
  gender: { type: String, enum: ['homme', 'femme', 'autre'] },
  bio: { type: String, maxlength: 500 },
  
  // Photos (max 6)
  photos: [{
    url: String,
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Localisation (GeoJSON)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    city: String,
    country: String
  },
  
  // Informations détaillées
  interests: [String],
  languages: [String],
  occupation: String,
  education: String,
  height: Number, // en cm
  hasChildren: { type: String, enum: ['oui', 'non', 'non-precise'] },
  sexualOrientation: { 
    type: String, 
    enum: ['heterosexuel', 'homosexuel', 'bisexuel', 'autre', 'non-precise'] 
  },
  housing: { 
    type: String, 
    enum: ['seul', 'colocation', 'parents', 'etudiant', 'autre'] 
  },
  smoker: { 
    type: String, 
    enum: ['oui', 'non', 'rarement', 'souvent'] 
  },
  lookingFor: { 
    type: String, 
    enum: ['relation-serieuse', 'rencontre-casual', 'amitie', 'ne-sais-pas'] 
  },
  interestedIn: { type: String, enum: ['homme', 'femme', 'tous'] },
  
  // Social
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matches: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    matchedAt: { type: Date, default: Date.now }
  }],
  
  // Préférences de recherche
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 99 }
    },
    distance: { type: Number, default: 50 }, // km
    showMe: [{ type: String, enum: ['homme', 'femme', 'autre'] }]
  },
  
  // Streaming
  isLive: { type: Boolean, default: false },
  liveStreamId: String,
  
  // Statut
  isVerified: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  
  // NOUVEAUX CHAMPS - Privilèges et Modération
  privilegeLevel: { 
    type: Number, 
    enum: [0, 1, 2, 3],
    default: 0,
    // 0 = Utilisateur normal
    // 1 = Modérateur
    // 2 = Administrateur
    // 3 = Super Admin
  },
  moderationPermissions: {
    canBanUsers: { type: Boolean, default: false },
    canDeleteContent: { type: Boolean, default: false },
    canManageStreams: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canIssueWarnings: { type: Boolean, default: false }
  },
  moderationStats: {
    actionsPerformed: { type: Number, default: 0 },
    reportsHandled: { type: Number, default: 0 },
    lastActionDate: Date
  },
  
  // Sanctions et Modération
  isBanned: { type: Boolean, default: false },
  banReason: String,
  bannedUntil: Date,
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warnings: [{
    reason: String,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now }
  }],
  
  // Comptes liés
  linkedAccounts: {
    google: { type: Boolean, default: false },
    facebook: { type: Boolean, default: false },
    apple: { type: Boolean, default: false },
    spotify: { type: Boolean, default: false },
    instagram: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Index géospatial pour recherche par proximité
userSchema.index({ 'location': '2dsphere' });

// Index pour recherche rapide (email et googleId déjà indexés via unique:true dans le schéma)
userSchema.index({ privilegeLevel: 1 });
userSchema.index({ isActive: 1, isBanned: 1 });

// Virtual pour calculer l'âge
userSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour obtenir un profil public
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    displayName: this.displayName || this.firstName,
    firstName: this.firstName,
    age: this.age,
    gender: this.gender,
    bio: this.bio,
    photos: this.photos,
    location: this.location,
    interests: this.interests,
    languages: this.languages,
    occupation: this.occupation,
    height: this.height,
    hasChildren: this.hasChildren,
    smoker: this.smoker,
    lookingFor: this.lookingFor,
    isVerified: this.isVerified,
    isPremium: this.isPremium,
    isLive: this.isLive,
    lastActive: this.lastActive
  };
};

// Méthodes de vérification des privilèges
userSchema.methods.isModerator = function() {
  return this.privilegeLevel >= 1;
};

userSchema.methods.isAdmin = function() {
  return this.privilegeLevel >= 2;
};

userSchema.methods.isSuperAdmin = function() {
  return this.privilegeLevel === 3;
};

userSchema.methods.canPerformAction = function(action) {
  if (this.privilegeLevel === 3) return true; // Super Admin peut tout faire
  if (this.privilegeLevel === 0) return false; // User normal ne peut rien faire
  
  return this.moderationPermissions[action] || false;
};

// Méthode pour promouvoir un utilisateur
userSchema.methods.promoteToModerator = function(permissions) {
  this.privilegeLevel = 1;
  this.moderationPermissions = {
    ...this.moderationPermissions,
    ...permissions
  };
};

// Méthode pour bannir un utilisateur
userSchema.methods.banUser = function(reason, duration, moderatorId) {
  this.isBanned = true;
  this.banReason = reason;
  this.bannedBy = moderatorId;
  
  if (duration) {
    const bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + duration);
    this.bannedUntil = bannedUntil;
  }
};

// Méthode pour débannir
userSchema.methods.unban = function() {
  this.isBanned = false;
  this.banReason = null;
  this.bannedUntil = null;
  this.bannedBy = null;
};

// Méthode pour ajouter un avertissement
userSchema.methods.addWarning = function(reason, moderatorId) {
  this.warnings.push({
    reason: reason,
    issuedBy: moderatorId,
    issuedAt: new Date()
  });
};

module.exports = mongoose.model('User', userSchema);
