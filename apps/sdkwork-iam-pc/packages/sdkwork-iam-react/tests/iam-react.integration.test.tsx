import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  IamRuntimeProvider,
  createMemoryIamTokenStore,
  useIamRuntime,
  useIamService,
} from "../src/index";

describe("@sdkwork/iam-react integration", () => {
  it("creates and provides an IAM runtime from generated SDK clients for fast app integration", async () => {
    const tokenStore = createMemoryIamTokenStore();

    render(
      <IamRuntimeProvider
        clients={{
          appbaseApp: createStandardAppClient(),
          appbaseBackend: {
            iam: createStandardBackendIamClient(),
          },
        }}
        config={{
          appId: "sdkwork-router",
          deploymentMode: "saas",
          environment: "test",
        }}
        tokenStore={tokenStore}
      >
        <Probe />
      </IamRuntimeProvider>,
    );

    expect(screen.getByTestId("deployment-mode")).toHaveTextContent("saas");
    expect(screen.getByTestId("has-service")).toHaveTextContent("yes");
  });
});

function Probe() {
  const runtime = useIamRuntime();
  const service = useIamService();

  return (
    <>
      <div data-testid="deployment-mode">{runtime.config.deploymentMode}</div>
      <div data-testid="has-service">{service ? "yes" : "no"}</div>
    </>
  );
}

function createStandardAppClient() {
  return {
    auth: {
      passwordResetRequests: {
        create: vi.fn(),
      },
      passwordResets: {
        create: vi.fn(),
      },
      registrations: {
        create: vi.fn(),
      },
      sessions: {
        create: vi.fn(),
        loginContextSelection: {
          create: vi.fn(),
        },
        organizationSelection: {
          create: vi.fn(),
        },
        current: {
          delete: vi.fn(),
          retrieve: vi.fn(),
          update: vi.fn(),
        },
        refresh: vi.fn(),
      },
    },
    oauth: {
      providers: {
        list: vi.fn(),
      },
      authorizationUrls: {
        create: vi.fn(),
      },
      deviceAuthorizations: {
        create: vi.fn(),
        retrieve: vi.fn(),
        scans: {
          create: vi.fn(),
        },
        passwordCompletions: {
          create: vi.fn(),
        },
        sessionExchanges: {
          create: vi.fn(),
        },
      },
      callbacks: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
      miniProgramSessions: {
        create: vi.fn(),
      },
      sessions: {
        create: vi.fn(),
      },
      accountLinks: {
        delete: vi.fn(),
        list: vi.fn(),
      },
      grants: {
        delete: vi.fn(),
        list: vi.fn(),
      },
    },
    system: {
      iam: {
        runtime: {
          retrieve: vi.fn(),
        },
        verificationPolicy: {
          retrieve: vi.fn(),
        },
        accountBindingPolicy: {
          retrieve: vi.fn(),
        },
      },
    },
    iam: {
      organizations: {
        list: vi.fn(),
        tree: {
          retrieve: vi.fn(),
        },
      },
      organizationMemberships: {
        list: vi.fn(),
      },
      departments: {
        list: vi.fn(),
        tree: {
          retrieve: vi.fn(),
        },
      },
      departmentAssignments: {
        list: vi.fn(),
      },
      positions: {
        list: vi.fn(),
      },
      positionAssignments: {
        list: vi.fn(),
      },
      roleBindings: {
        list: vi.fn(),
      },
      users: {
        current: {
          retrieve: vi.fn(),
          update: vi.fn(),
          emailBindings: {
            create: vi.fn(),
            delete: vi.fn(),
          },
          phoneBindings: {
            create: vi.fn(),
            delete: vi.fn(),
          },
          password: {
            update: vi.fn(),
          },
        },
      },
    },
  };
}

function createStandardBackendIamClient() {
  return {
    accessCredentials: {
      create: vi.fn(),
    },
    applications: {
      register: vi.fn(),
    },
    apiKeys: {
      list: vi.fn(),
      revoke: vi.fn(),
    },
    auditEvents: {
      list: vi.fn(),
    },
    organizations: {
      create: vi.fn(),
      delete: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    organizationMemberships: {
      create: vi.fn(),
      update: vi.fn(),
    },
    departments: {
      create: vi.fn(),
      delete: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    departmentAssignments: {
      create: vi.fn(),
      update: vi.fn(),
    },
    permissions: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    policies: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    accountBindingPolicy: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    positions: {
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    positionAssignments: {
      create: vi.fn(),
      update: vi.fn(),
    },
    roles: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      permissions: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
    },
    roleBindings: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    securityEvents: {
      list: vi.fn(),
    },
    tenantApplications: {
      enable: vi.fn(),
      provision: vi.fn(),
      update: vi.fn(),
    },
    tenants: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      members: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
      },
    },
    users: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
  };
}
