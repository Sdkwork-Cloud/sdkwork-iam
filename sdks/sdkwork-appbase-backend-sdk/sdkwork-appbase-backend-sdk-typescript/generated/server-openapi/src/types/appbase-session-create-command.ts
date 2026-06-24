/** Session creation command for credential login and external user-center session exchange. */
export interface AppbaseSessionCreateCommand {
  /** Email credential used by standard password login. */
  email?: string;
  /** Username credential used by standard password login. */
  username?: string;
  /** Phone credential used by standard password login. */
  phone?: string;
  /** Write-only password credential used by standard password login. */
  password?: string;
  /** Opaque upstream credential used only by an external user-center session exchange. */
  externalToken?: string;
  /** External authority provider key used to select the configured bridge. */
  providerKey?: string;
  /** Verified tenant id supplied by an external user-center session exchange after upstream identity validation. */
  tenantId?: string;
  /** Verified organization id supplied by an external user-center session exchange when the upstream identity resolved an organization scope. */
  organizationId?: string;
}
