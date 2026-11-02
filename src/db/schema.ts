import { pgTable, integer, text, serial, boolean } from 'drizzle-orm/pg-core';

// Artists table
export const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  surname: text('surname'),
  artistName: text('artist_name'),
  bio: text('bio'),
  contractSigned: boolean('contract_signed').default(false),
  socialNetwork: text('social_network'),
  plan: text('plan').notNull().default('none'),
  role: text('role'),
  isBlocked: boolean('is_blocked').default(false),
  isDeactivated: boolean('is_deactivated').default(false),
  deactivationReason: text('deactivation_reason'),
  isAdmin: boolean('is_admin').default(false),
  isManager: boolean('is_manager').default(false),
    isApproved: boolean('is_approved').default(false),
    requiresApproval: boolean('requires_approval').default(false),
    emailVerified: boolean('email_verified').default(false),
  verificationCode: text('verification_code'),
  accessRequestMessage: text('access_request_message'),
  howDidYouHear: text('how_did_you_hear'),
  isFrozen: boolean('is_frozen').default(false),
  managerId: integer('manager_id').references(() => artists.id),
  theme: text('theme').notNull().default('light'),
  showSnowflakes: boolean('show_snowflakes').default(false),
  showGarland: boolean('show_garland').default(false),
  avatarUrl: text('avatar_url'),
  label: text('label').notNull().default('Music Love'),
  lastActiveAt: text('last_active_at'),
  telegramChatId: text('telegram_chat_id'),
  createdAt: text('created_at').notNull(),
});

// Password history table
export const passwordHistory = pgTable('password_history', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  password: text('password').notNull(),
  createdAt: text('created_at').notNull(),
});

// Releases table
export const releases = pgTable('releases', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  coverUrl: text('cover_url').notNull(),
  releaseDate: text('release_date'),
  startDate: text('start_date'),
  preorderDate: text('pre_order_date'),
  isAsap: boolean('is_asap').default(false),
  mainArtist: text('main_artist').notNull(),
  additionalArtists: text('additional_artists'),
  genre: text('genre').notNull(),
  subgenre: text('subgenre'),
  promoText: text('promo_text'),
  useEditorialPromo: boolean('use_editorial_promo').default(false),
  label: text('label').notNull().default('Music Love'),
  artistComment: text('artist_comment'),
  moderatorComment: text('moderator_comment'),
  status: text('status').notNull().default('draft'),
  upc: text('upc'),
  metadataLang: text('metadata_language'),
  partnerCode: text('partner_code'),
  rightsYear: text('copyright_year'),
  earlyRussia: boolean('early_russia').default(false),
  earlyReleaseRussia: boolean('early_release_russia').default(false),
  realtimeDelivery: boolean('realtime_delivery').default(false),
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
export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
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
  explicit: boolean('explicit').default(false),
  isLive: boolean('is_live').default(false),
  isCover: boolean('is_cover').default(false),
  isRemix: boolean('is_remix').default(false),
  isInstrumental: boolean('is_instrumental').default(false),
  isrc: text('isrc'),
  partnerCode: text('partner_code'),
  previewStart: text('preview_start'),
  instantGratification: boolean('instant_gratification').default(false),
  focusTrack: boolean('focus_track').default(false),
  version: text('version'),
  copyrightShare: text('copyright_share'),
  relatedRightsShare: text('related_rights_share'),
  copyrightPercent: text('copyright_percent'),
  neighboringRightsPercent: text('neighboring_rights_percent'),
  personsJson: text('persons_json'),
  createdAt: text('created_at').notNull(),
});

// News table
export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  links: text('links'),
  createdBy: integer('created_by').notNull().references(() => artists.id),
  createdAt: text('created_at').notNull(),
  published: boolean('published').default(true),
});

// FAQ table
export const faq = pgTable('faq', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').notNull(),
});

// Add new lyrics_submissions table with complete structure
export const lyricsSubmissions = pgTable('lyrics_submissions', {
  id: serial('id').primaryKey(),
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
export const artistAnalytics = pgTable('artist_analytics', {
  id: serial('id').primaryKey(),
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
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => artists.id).unique(),
  theme: text('theme').notNull().default('light'),
  snowflakesEnabled: boolean('snowflakes_enabled').default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add new release_history table at the end
export const releaseHistory = pgTable('release_history', {
  id: serial('id').primaryKey(),
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
export const managerActions = pgTable('manager_actions', {
  id: serial('id').primaryKey(),
  managerId: integer('manager_id').notNull().references(() => artists.id),
  action: text('action').notNull(),
  targetId: integer('target_id'),
  details: text('details'),
  createdAt: text('created_at').notNull(),
});

// Add new tickets table
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
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
export const ticketMessages = pgTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  senderId: integer('sender_id').notNull(),
  senderType: text('sender_type').notNull(),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

// Add new ticket_notes table
export const ticketNotes = pgTable('ticket_notes', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  note: text('note').notNull(),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by').notNull(),
  createdById: integer('created_by_id').notNull(),
});

// Ticket attachments table
export const ticketAttachments = pgTable('ticket_attachments', {
  id: serial('id').primaryKey(),
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
export const artistWallets = pgTable('artist_wallets', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').notNull().references(() => artists.id).unique(),
  balanceRub: text('balance_rub').notNull().default('0'),
  balanceUsd: text('balance_usd').notNull().default('0'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Financial reports table
export const financialReports = pgTable('financial_reports', {
  id: serial('id').primaryKey(),
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
  isRoyalty: boolean('is_royalty').default(true),
  agreedAt: text('agreed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Wallet transactions table
export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
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
export const artistPaymentDetails = pgTable('artist_payment_details', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').notNull().references(() => artists.id).unique(),
  fullName: text('full_name').notNull(),
  cardNumber: text('card_number').notNull(),
  bankName: text('bank_name').notNull(),
  kbe: text('kbe'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});


// Admin permissions table - granular permissions for sub-admins
export const adminPermissions = pgTable('admin_permissions', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull().references(() => artists.id).unique(),
  // Section visibility
  canAccessDashboard: boolean('can_access_dashboard').default(true),
  canAccessArtists: boolean('can_access_artists').default(true),
  canAccessReleases: boolean('can_access_releases').default(true),
  canAccessWallets: boolean('can_access_wallets').default(false),
  canAccessNews: boolean('can_access_news').default(true),
  canAccessFaq: boolean('can_access_faq').default(true),
  canAccessTickets: boolean('can_access_tickets').default(true),
  canAccessPendingUsers: boolean('can_access_pending_users').default(true),
  canAccessLyrics: boolean('can_access_lyrics').default(true),
  canAccessStaff: boolean('can_access_staff').default(false),
  // Action permissions
  canEditReleases: boolean('can_edit_releases').default(true),
  canDeleteReleases: boolean('can_delete_releases').default(false),
  canDownloadFiles: boolean('can_download_files').default(true),
  canApproveReleases: boolean('can_approve_releases').default(true),
  canEditArtists: boolean('can_edit_artists').default(true),
  canDeleteArtists: boolean('can_delete_artists').default(false),
  canManagePayouts: boolean('can_manage_payouts').default(false),
  canManageUsers: boolean('can_manage_users').default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Bot settings table — stores global on/off flag and other config
export const botSettings = pgTable('bot_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g. 'telegram_enabled'
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Pitching submissions table
export const pitchings = pgTable('pitchings', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  releaseId: integer('release_id').notNull().references(() => releases.id),
  promoText: text('promo_text').notNull(),
  status: text('status').notNull().default('pending'), // pending | reviewed | rejected
  adminNote: text('admin_note'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Verifications table
export const verifications = pgTable('verifications', {
  id: serial('id').primaryKey(),
  artistId: integer('artist_id').notNull(),
  role: text('role').notNull().default('artist'),
  contractType: text('contract_type'),
  country: text('country'),
  step: integer('step').notNull().default(0),
  passportData: text('passport_data'),
  addressData: text('address_data'),
  bankData: text('bank_data'),
  npdConfirmed: boolean('npd_confirmed').default(false),
  finalConfirmed: boolean('final_confirmed').default(false),
  status: text('status').notNull().default('draft'), // draft | submitted | approved | rejected
  submittedAt: text('submitted_at'),
  reviewedAt: text('reviewed_at'),
  reviewedBy: text('reviewed_by'),
  adminComment: text('admin_comment'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
