import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Artists table
export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  surname: text('surname'),
  artistName: text('artist_name'),
  bio: text('bio'),
  contractSigned: integer('contract_signed', { mode: 'boolean' }).default(false),
  socialNetwork: text('social_network'),
  plan: text('plan').notNull().default('none'),
  role: text('role'),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).default(false),
  isDeactivated: integer('is_deactivated', { mode: 'boolean' }).default(false),
  deactivationReason: text('deactivation_reason'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  isManager: integer('is_manager', { mode: 'boolean' }).default(false),
    isApproved: integer('is_approved', { mode: 'boolean' }).default(false),
    requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(false),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  verificationCode: text('verification_code'),
  accessRequestMessage: text('access_request_message'),
  howDidYouHear: text('how_did_you_hear'),
  isFrozen: integer('is_frozen', { mode: 'boolean' }).default(false),
  managerId: integer('manager_id').references(() => artists.id),
  theme: text('theme').notNull().default('light'),
  showSnowflakes: integer('show_snowflakes', { mode: 'boolean' }).default(false),
  showGarland: integer('show_garland', { mode: 'boolean' }).default(false),
  avatarUrl: text('avatar_url'),
  label: text('label').notNull().default('Music Love'),
  lastActiveAt: text('last_active_at'),
  telegramChatId: text('telegram_chat_id'),
  createdAt: text('created_at').notNull(),
});

// Password history table
export const passwordHistory = sqliteTable('password_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  password: text('password').notNull(),
  createdAt: text('created_at').notNull(),
});

// Releases table
export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  coverUrl: text('cover_url').notNull(),
  releaseDate: text('release_date'),
  startDate: text('start_date'),
  preorderDate: text('pre_order_date'),
  isAsap: integer('is_asap', { mode: 'boolean' }).default(false),
  mainArtist: text('main_artist').notNull(),
  additionalArtists: text('additional_artists'),
  genre: text('genre').notNull(),
  subgenre: text('subgenre'),
  promoText: text('promo_text'),
  useEditorialPromo: integer('use_editorial_promo', { mode: 'boolean' }).default(false),
  label: text('label').notNull().default('Music Love'),
  artistComment: text('artist_comment'),
  moderatorComment: text('moderator_comment'),
  status: text('status').notNull().default('draft'),
  upc: text('upc'),
  metadataLang: text('metadata_language'),
  partnerCode: text('partner_code'),
  rightsYear: text('copyright_year'),
  earlyRussia: integer('early_russia', { mode: 'boolean' }).default(false),
  earlyReleaseRussia: integer('early_release_russia', { mode: 'boolean' }).default(false),
  realtimeDelivery: integer('realtime_delivery', { mode: 'boolean' }).default(false),
  distribution: text('distribution'),
  releaseVariant: text('release_variant'),
  localizationJson: text('localization_json'),
  platforms: text('platforms'), // JSON array of selected platform IDs
  territories: text('territories'), // JSON array of selected country codes
  persons: text('persons'), // JSON array of persons with roles
  deactivationReason: text('deactivation_reason'),
  deactivatedAt: text('deactivated_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tracks table
export const tracks = sqliteTable('tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  releaseId: integer('release_id').notNull().references(() => releases.id),
  trackNumber: integer('track_number').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  url: text('url').notNull(),
  artists: text('artists').notNull(),
  musicAuthor: text('music_author'),
  lyricsAuthor: text('lyrics_author'),
  producer: text('producer'),
  composer: text('composer'),
  lyrics: text('lyrics'),
  language: text('language'),
  explicit: integer('explicit', { mode: 'boolean' }).default(false),
  isLive: integer('is_live', { mode: 'boolean' }).default(false),
  isCover: integer('is_cover', { mode: 'boolean' }).default(false),
  isRemix: integer('is_remix', { mode: 'boolean' }).default(false),
  isInstrumental: integer('is_instrumental', { mode: 'boolean' }).default(false),
  isrc: text('isrc'),
  partnerCode: text('partner_code'),
  previewStart: text('preview_start'),
  instantGratification: integer('instant_gratification', { mode: 'boolean' }).default(false),
  focusTrack: integer('focus_track', { mode: 'boolean' }).default(false),
  version: text('version'),
  copyrightShare: text('copyright_share'),
  relatedRightsShare: text('related_rights_share'),
  copyrightPercent: text('copyright_percent'),
  neighboringRightsPercent: text('neighboring_rights_percent'),
  personsJson: text('persons_json'),
  createdAt: text('created_at').notNull(),
});

// News table
export const news = sqliteTable('news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  links: text('links'),
  createdBy: integer('created_by').notNull().references(() => artists.id),
  createdAt: text('created_at').notNull(),
  published: integer('published', { mode: 'boolean' }).default(true),
});

// FAQ table
export const faq = sqliteTable('faq', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').notNull(),
});

// Add new lyrics_submissions table with complete structure
export const lyricsSubmissions = sqliteTable('lyrics_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  releaseId: integer('release_id').references(() => releases.id),
  trackName: text('track_name').notNull(),
  lyricLink: text('lyric_link').notNull(),
  platform: text('platform').notNull(),
  status: text('status').notNull().default('sent'),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Artist analytics table
export const artistAnalytics = sqliteTable('artist_analytics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  date: text('date').notNull(), // ISO date string YYYY-MM-DD
  totalStreams: integer('total_streams').notNull().default(0),
  streamsOver30s: integer('streams_over_30s').notNull().default(0),
  uniqueListeners: integer('unique_listeners').notNull().default(0),
  subscribers: integer('subscribers').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// User settings table
export const userSettings = sqliteTable('user_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => artists.id).unique(),
  theme: text('theme').notNull().default('light'),
  snowflakesEnabled: integer('snowflakes_enabled', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add new release_history table at the end
export const releaseHistory = sqliteTable('release_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  releaseId: integer('release_id').notNull().references(() => releases.id),
  action: text('action').notNull(),
  field: text('field'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  performedBy: text('performed_by').notNull(),
  performedAt: text('performed_at').notNull(),
  description: text('description'),
});

// Add new manager_actions table at the end
export const managerActions = sqliteTable('manager_actions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  managerId: integer('manager_id').notNull().references(() => artists.id),
  action: text('action').notNull(),
  targetId: integer('target_id'),
  details: text('details'),
  createdAt: text('created_at').notNull(),
});

// Add new tickets table
export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  subject: text('subject').notNull(),
  initialMessage: text('initial_message').notNull(),
  status: text('status').notNull().default('В работе'),
  createdAt: text('created_at').notNull(),
  closedAt: text('closed_at'),
  closedBy: text('closed_by'),
  lastResponseAt: text('last_response_at'),
  lastResponseBy: text('last_response_by'),
});

// Add new ticket_messages table
export const ticketMessages = sqliteTable('ticket_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  senderId: integer('sender_id').notNull(),
  senderType: text('sender_type').notNull(),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

// Add new ticket_notes table
export const ticketNotes = sqliteTable('ticket_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  note: text('note').notNull(),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by').notNull(),
  createdById: integer('created_by_id').notNull(),
});

// Ticket attachments table
export const ticketAttachments = sqliteTable('ticket_attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  messageId: integer('message_id').references(() => ticketMessages.id),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  uploadedBy: integer('uploaded_by').notNull().references(() => artists.id),
  uploadedByType: text('uploaded_by_type').notNull(),
  createdAt: text('created_at').notNull(),
});

// Artist wallets table
export const artistWallets = sqliteTable('artist_wallets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id).unique(),
  balanceRub: text('balance_rub').notNull().default('0'),
  balanceUsd: text('balance_usd').notNull().default('0'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Financial reports table
export const financialReports = sqliteTable('financial_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  title: text('title').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  quarter: integer('quarter'),
  year: integer('year').notNull(),
  amountRub: text('amount_rub').notNull().default('0'),
  amountUsd: text('amount_usd').notNull().default('0'),
  status: text('status').notNull().default('pending'),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  details: text('details'),
  isRoyalty: integer('is_royalty', { mode: 'boolean' }).default(true),
  agreedAt: text('agreed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Wallet transactions table
export const walletTransactions = sqliteTable('wallet_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  type: text('type').notNull(),
  amountRub: text('amount_rub').notNull().default('0'),
  amountUsd: text('amount_usd').notNull().default('0'),
  description: text('description'),
  reportId: integer('report_id').references(() => financialReports.id),
  status: text('status').notNull().default('completed'),
  createdAt: text('created_at').notNull(),
});

// Artist payment details table
export const artistPaymentDetails = sqliteTable('artist_payment_details', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id).unique(),
  fullName: text('full_name').notNull(),
  cardNumber: text('card_number').notNull(),
  bankName: text('bank_name').notNull(),
  kbe: text('kbe'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});


// Admin permissions table - granular permissions for sub-admins
export const adminPermissions = sqliteTable('admin_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: integer('admin_id').notNull().references(() => artists.id).unique(),
  // Section visibility
  canAccessDashboard: integer('can_access_dashboard', { mode: 'boolean' }).default(true),
  canAccessArtists: integer('can_access_artists', { mode: 'boolean' }).default(true),
  canAccessReleases: integer('can_access_releases', { mode: 'boolean' }).default(true),
  canAccessWallets: integer('can_access_wallets', { mode: 'boolean' }).default(false),
  canAccessNews: integer('can_access_news', { mode: 'boolean' }).default(true),
  canAccessFaq: integer('can_access_faq', { mode: 'boolean' }).default(true),
  canAccessTickets: integer('can_access_tickets', { mode: 'boolean' }).default(true),
  canAccessPendingUsers: integer('can_access_pending_users', { mode: 'boolean' }).default(true),
  canAccessLyrics: integer('can_access_lyrics', { mode: 'boolean' }).default(true),
  canAccessStaff: integer('can_access_staff', { mode: 'boolean' }).default(false),
  // Action permissions
  canEditReleases: integer('can_edit_releases', { mode: 'boolean' }).default(true),
  canDeleteReleases: integer('can_delete_releases', { mode: 'boolean' }).default(false),
  canDownloadFiles: integer('can_download_files', { mode: 'boolean' }).default(true),
  canApproveReleases: integer('can_approve_releases', { mode: 'boolean' }).default(true),
  canEditArtists: integer('can_edit_artists', { mode: 'boolean' }).default(true),
  canDeleteArtists: integer('can_delete_artists', { mode: 'boolean' }).default(false),
  canManagePayouts: integer('can_manage_payouts', { mode: 'boolean' }).default(false),
  canManageUsers: integer('can_manage_users', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Bot settings table — stores global on/off flag and other config
export const botSettings = sqliteTable('bot_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(), // e.g. 'telegram_enabled'
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Pitching submissions table
export const pitchings = sqliteTable('pitchings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  releaseId: integer('release_id').notNull().references(() => releases.id),
  promoText: text('promo_text').notNull(),
  status: text('status').notNull().default('pending'), // pending | reviewed | rejected
  adminNote: text('admin_note'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Verifications table
export const verifications = sqliteTable('verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artistId: integer('artist_id').notNull(),
  role: text('role').notNull().default('artist'),
  contractType: text('contract_type'),
  country: text('country'),
  step: integer('step').notNull().default(0),
  passportData: text('passport_data'),
  addressData: text('address_data'),
  bankData: text('bank_data'),
  npdConfirmed: integer('npd_confirmed', { mode: 'boolean' }).default(false),
  finalConfirmed: integer('final_confirmed', { mode: 'boolean' }).default(false),
  status: text('status').notNull().default('draft'), // draft | submitted | approved | rejected
  submittedAt: text('submitted_at'),
  reviewedAt: text('reviewed_at'),
  reviewedBy: text('reviewed_by'),
  adminComment: text('admin_comment'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
