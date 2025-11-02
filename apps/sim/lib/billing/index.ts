/**
 * Billing System - Main Entry Point
 * Provides clean, organized exports for the billing system
 */

export * from '@/billing/calculations/usage-monitor'
export * from '@/billing/core/billing'
export * from '@/billing/core/organization'
export * from '@/billing/core/subscription'
export {
  getHighestPrioritySubscription as getActiveSubscription,
  getUserSubscriptionState as getSubscriptionState,
  isEnterprisePlan as hasEnterprisePlan,
  isProPlan as hasProPlan,
  isTeamPlan as hasTeamPlan,
  sendPlanWelcomeEmail,
} from '@/billing/core/subscription'
export * from '@/billing/core/usage'
export {
  checkUsageStatus,
  getTeamUsageLimits,
  getUserUsageData as getUsageData,
  getUserUsageLimit as getUsageLimit,
  updateUserUsageLimit as updateUsageLimit,
} from '@/billing/core/usage'
export * from '@/billing/subscriptions/utils'
export { canEditUsageLimit as canEditLimit } from '@/billing/subscriptions/utils'
export * from '@/billing/types'
export * from '@/billing/validation/seat-management'
