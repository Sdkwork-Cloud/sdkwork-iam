# -*- coding: utf-8 -*-
import io

p = "src/components/oauth-account-setup-section.tsx"
s = io.open(p, encoding="utf-8").read()

# ---- 1. effectiveVerifyFiles: pass kind ----
old = """  const effectiveVerifyFiles = collectConfiguredDomains(form.config);"""
new = """  const effectiveVerifyFiles = collectConfiguredDomains(form.config, kind);"""
assert old in s, "effective"
s = s.replace(old, new, 1)

# ---- 2. tabs list: hide server tab for mini programs ----
old = """      <TabsList className="w-full">
        <TabsTrigger className="flex-1" value="basic">{quickSetup.tabs.basic}</TabsTrigger>
        <TabsTrigger className="flex-1" value="config">{quickSetup.tabs.config}</TabsTrigger>
        <TabsTrigger className="flex-1" value="server">{quickSetup.tabs.server}</TabsTrigger>
        <TabsTrigger className="flex-1" value="status">{quickSetup.tabs.status}</TabsTrigger>
      </TabsList>"""
new = """      <TabsList className="w-full">
        <TabsTrigger className="flex-1" value="basic">{quickSetup.tabs.basic}</TabsTrigger>
        <TabsTrigger className="flex-1" value="config">{quickSetup.tabs.config}</TabsTrigger>
        {kind === "official_account" ? (
          <TabsTrigger className="flex-1" value="server">{quickSetup.tabs.server}</TabsTrigger>
        ) : null}
        <TabsTrigger className="flex-1" value="status">{quickSetup.tabs.status}</TabsTrigger>
      </TabsList>"""
assert old in s, "tabs list"
s = s.replace(old, new, 1)

# ---- 3. basic info: account type select kind aware ----
old = """        <OauthAdminSelectField
          label={quickSetup.accountType.label}
          onChange={(accountType) => onChange({ accountType })}
          options={accountTypeOptions(allMessages)}
          value={form.accountType}
        />"""
new = """        <OauthAdminSelectField
          label={kind === "mini_program" ? quickSetup.accountType.subjectLabel : quickSetup.accountType.label}
          onChange={(accountType) => onChange({ accountType })}
          options={accountTypeOptions(allMessages, kind)}
          value={form.accountType}
        />"""
assert old in s, "basic type select"
s = s.replace(old, new, 1)

# ---- 4. developer config: web domain section only for official accounts ----
old = """      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="config">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.basic.webDomain}
          </h3>
          <OauthAdminField
            label={configCopy.basic.webDomain}
            onChange={setWebDomain}
            placeholder={configCopy.basic.webDomainPlaceholder}
            value={form.config.webDomain ?? ""}
          />
          <OauthAdminField
            label={configCopy.basic.callbackUrl}
            onChange={(redirectUri) => onChange({ config: { ...form.config, redirectUri } })}
            type="url"
            value={form.config.redirectUri ?? ""}
          />
          <StatusNotice tone="default">{configCopy.basic.callbackUrlHint}</StatusNotice>
        </section>
"""
new = """      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="config">
        {kind === "official_account" ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.basic.webDomain}
            </h3>
            <OauthAdminField
              label={configCopy.basic.webDomain}
              onChange={setWebDomain}
              placeholder={configCopy.basic.webDomainPlaceholder}
              value={form.config.webDomain ?? ""}
            />
            <OauthAdminField
              label={configCopy.basic.callbackUrl}
              onChange={(redirectUri) => onChange({ config: { ...form.config, redirectUri } })}
              type="url"
              value={form.config.redirectUri ?? ""}
            />
            <StatusNotice tone="default">{configCopy.basic.callbackUrlHint}</StatusNotice>
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {copy.appIdLabel}
            </h3>
            <OauthAdminField
              label={copy.appIdLabel}
              onChange={(redirectUri) => onChange({ config: { ...form.config, redirectUri } })}
              placeholder={copy.appIdPlaceholder}
              type="url"
              value={form.config.redirectUri ?? ""}
            />
          </section>
        )}
"""
assert old in s, "web domain section"
s = s.replace(old, new, 1)

# ---- 5. mini program server domain list (replace TagInput fields) ----
old = """        {kind === "official_account" ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.domains.officialTitle}
            </h3>
            <StatusNotice tone="default">{configCopy.domains.officialDescription}</StatusNotice>
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.jsSecureDomains}
              onChange={setJsSecureDomains}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.jsSecureDomains ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.businessDomains}
              onChange={setBusinessDomains}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.businessDomains ?? legacyBusinessDomains(form.config)}
            />
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.domains.title}
            </h3>
            <StatusNotice tone="default">{configCopy.domains.description}</StatusNotice>
            <DomainTagField
              hint={configCopy.domains.requestHint}
              label={configCopy.domains.request}
              onChange={(values) => setDomains("request", values)}
              value={form.config.domains?.request ?? []}
            />
            <DomainTagField
              label={configCopy.domains.socket}
              onChange={(values) => setDomains("socket", values)}
              value={form.config.domains?.socket ?? []}
            />
            <DomainTagField
              label={configCopy.domains.uploadFile}
              onChange={(values) => setDomains("uploadFile", values)}
              value={form.config.domains?.uploadFile ?? []}
            />
            <DomainTagField
              label={configCopy.domains.downloadFile}
              onChange={(values) => setDomains("downloadFile", values)}
              value={form.config.domains?.downloadFile ?? []}
            />
            <DomainTagField
              hint={configCopy.domains.businessHint}
              label={configCopy.domains.business}
              onChange={(values) => setDomains("business", values)}
              value={form.config.domains?.business ?? []}
            />
          </section>
        )}"""
new = """        {kind === "official_account" ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.domains.officialTitle}
            </h3>
            <StatusNotice tone="default">{configCopy.domains.officialDescription}</StatusNotice>
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.jsSecureDomains}
              onChange={setJsSecureDomains}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.jsSecureDomains ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.businessDomains}
              onChange={setBusinessDomains}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.businessDomains ?? legacyBusinessDomains(form.config)}
            />
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.domains.title}
            </h3>
            <StatusNotice tone="default">{configCopy.domains.miniDescription}</StatusNotice>
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.request}
              onChange={(values) => setDomains("request", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.request ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.socket}
              onChange={(values) => setDomains("socket", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.socket ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.uploadFile}
              onChange={(values) => setDomains("uploadFile", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.uploadFile ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.downloadFile}
              onChange={(values) => setDomains("downloadFile", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.downloadFile ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.business}
              onChange={(values) => setDomains("business", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.business ?? []}
            />
          </section>
        )}"""
assert old in s, "domain section"
s = s.replace(old, new, 1)

# ---- 6. server config tab content: only official ----
old = """      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="server">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.notify.title}
          </h3>"""
new = """      {kind === "official_account" ? (
      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="server">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.notify.title}
          </h3>"""
assert old in s, "server tab open"
s = s.replace(old, new, 1)

old = """            <StatusNotice tone="default">{configCopy.notify.syncHint}</StatusNotice>
          </section>
        </TabsContent>

      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="status">"""
new = """            <StatusNotice tone="default">{configCopy.notify.syncHint}</StatusNotice>
          </section>
        </TabsContent>
      ) : null}

      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="status">"""
assert old in s, "server tab close"
s = s.replace(old, new, 1)

io.open(p, "w", encoding="utf-8", newline="").write(s)
print("ok")
