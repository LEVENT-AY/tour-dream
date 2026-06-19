import type { AgentNotificationPrefs as _AgentNotificationPrefs } from "../services/agentServices";

export type UserRole = "customer" | "agent" | "admin";
export type AgentNotificationPrefs = _AgentNotificationPrefs;
export type AgentStatus = "pending" | "approved" | "rejected" | "suspended";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  agentStatus?: AgentStatus;
  approved?: boolean;
  suspended?: boolean;
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  taxNumber?: string;
  description?: string;
  notifications?: AgentNotificationPrefs;
  joinedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
