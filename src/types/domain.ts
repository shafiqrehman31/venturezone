import type { Timestamp } from 'firebase/firestore';

export type OrderWorkflowStatus =
  | 'New Lead'
  | 'KYC Submitted'
  | 'Trade Name Approved'
  | 'E-License Issued'
  | 'Emirates ID & Bank'
  | 'Completed';

export type PipedriveSyncStatus = 'pending' | 'synced' | 'pending_config' | 'failed';

export type JurisdictionType = 'Free Zone' | 'Mainland';

export interface FormationOrder {
  id: string;
  trackingCode: string;
  fullName: string;
  countryCode: string;
  whatsappNumber: string;
  email?: string;
  jurisdiction: JurisdictionType;
  authority: string;
  businessActivity: string;
  visaCount: number;
  packageId: string;
  packageName: string;
  estimatedTotalAed: number;
  status: OrderWorkflowStatus;
  currentStep: number;
  source?: string;
  pipedriveSyncStatus: PipedriveSyncStatus;
  pipedriveDealId?: string;
  pipedrivePersonId?: string;
  pipedriveError?: string;
  notes?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface OrderStatusPublic {
  trackingCode: string;
  jurisdiction: JurisdictionType;
  authority: string;
  packageName: string;
  visaCount: number;
  estimatedTotalAed: number;
  status: OrderWorkflowStatus;
  currentStep: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type InventoryCategory =
  | 'License Quota'
  | 'Visa Allocation'
  | 'Banking Slot'
  | 'VIP Medical';

export type AlertChannel = 'Dashboard Banner' | 'Ops Slack Channel' | 'Daily Digest';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  packageKey?: string;
  stockLevel: number;
  maxCapacity: number;
  lowThreshold: number;
  alertEnabled: boolean;
  alertChannel?: AlertChannel;
  unitCostAed: number;
  updatedAt?: Timestamp | null;
}

export interface InventoryAlert {
  id: string;
  inventoryId: string;
  itemName: string;
  stockLevel: number;
  threshold: number;
  severity: 'warning' | 'critical';
  acknowledged: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CmsLandingConfig {
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  phoneDisplay: string;
  googleRatingScore: string;
  googleReviewCount: string;
  zeroVisaPriceAed: number;
  oneVisaPriceAed: number;
  mainlandPriceAed: number;
  promoNotice?: string;
  siteName?: string;
  logoDataUrl?: string;
  footerLogoDataUrl?: string;
  faviconDataUrl?: string;
  socialLinkedin?: string;
  socialInstagram?: string;
  socialX?: string;
  socialYoutube?: string;
  socialFacebook?: string;
  updatedAt?: Timestamp | null;
}

export interface NavMenuItem {
  id: string;
  label: string;
  slug: string;
  order: number;
  visible: boolean;
  isBuiltIn: boolean;
  pageTitle: string;
  pageSubtitle?: string;
  pageBody?: string;
  ctaLabel?: string;
  updatedAt?: Timestamp | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  readTimeMinutes: number;
  authorName: string;
  status: 'draft' | 'published';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type ReportType =
  | 'orders_csv'
  | 'analytics_summary'
  | 'inventory_audit'
  | 'pipedrive_sync_log';

export interface ReportExport {
  id: string;
  reportName: string;
  reportType: ReportType;
  cadence: 'manual' | 'daily' | 'weekly';
  recordCount: number;
  totalValueAed: number;
  generatedBy: string;
  createdAt?: Timestamp | null;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'operations';
  createdAt?: Timestamp | null;
}

export interface CostBreakdown {
  packageId: string;
  packageName: string;
  authority: string;
  licenseFeeAed: number;
  establishmentCardAed: number;
  visaAllocationAed: number;
  emiratesIdMedicalAed: number;
  bankSupportFeeAed: number;
  totalAed: number;
  totalUsd: number;
}

export type ContactInquiryStatus = 'New' | 'Proposal Sent' | 'Contacted' | 'Closed';

export type ContactEmailStatus = 'sent' | 'template_ready' | 'failed';

export type ContactJurisdiction = 'All UAE Free Zones' | 'Dubai Mainland (DET)' | 'Need Advice';

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  countryCode: string;
  whatsappNumber: string;
  jurisdiction: ContactJurisdiction;
  serviceInterest: string;
  message?: string;
  status: ContactInquiryStatus;
  emailStatus: ContactEmailStatus;
  emailSubject?: string;
  emailNote?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

