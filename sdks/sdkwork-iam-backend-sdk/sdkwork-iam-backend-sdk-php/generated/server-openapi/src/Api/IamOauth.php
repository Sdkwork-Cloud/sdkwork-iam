<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\BackendSdk\Api;

use SDKWork\\Iam\\BackendSdk\Models\AppbaseApiResult;

final class IamOauthApi extends BaseApi
{
    /** Iam oauth account Links list. */
    public function accountLinksList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/account_links';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth account Links update. */
    public function accountLinksUpdate(string $accountLinkId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/account_links/{accountLinkId}', ['accountLinkId' => $this->serializePathParameter($accountLinkId, new PathParameterSpec('accountLinkId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth callback Events list. */
    public function callbackEventsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/callback_events';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth claim Mappings list. */
    public function claimMappingsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/claim_mappings';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth claim Mappings create. */
    public function claimMappingsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/claim_mappings';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth claim Mappings update. */
    public function claimMappingsUpdate(string $mappingId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/claim_mappings/{mappingId}', ['mappingId' => $this->serializePathParameter($mappingId, new PathParameterSpec('mappingId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth clients list. */
    public function clientsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/clients';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth clients create. */
    public function clientsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/clients';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth clients delete. */
    public function clientsDelete(string $oauthClientId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/clients/{oauthClientId}', ['oauthClientId' => $this->serializePathParameter($oauthClientId, new PathParameterSpec('oauthClientId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth clients retrieve. */
    public function clientsRetrieve(string $oauthClientId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/clients/{oauthClientId}', ['oauthClientId' => $this->serializePathParameter($oauthClientId, new PathParameterSpec('oauthClientId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth clients update. */
    public function clientsUpdate(string $oauthClientId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/clients/{oauthClientId}', ['oauthClientId' => $this->serializePathParameter($oauthClientId, new PathParameterSpec('oauthClientId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth diagnostic Runs list. */
    public function diagnosticRunsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/diagnostic_runs';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth diagnostic Runs create. */
    public function diagnosticRunsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/diagnostic_runs';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth diagnostic Runs retrieve. */
    public function diagnosticRunsRetrieve(string $diagnosticRunId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/diagnostic_runs/{diagnosticRunId}', ['diagnosticRunId' => $this->serializePathParameter($diagnosticRunId, new PathParameterSpec('diagnosticRunId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth flow Configs list. */
    public function flowConfigsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/flow_configs';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth flow Configs create. */
    public function flowConfigsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/flow_configs';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth flow Configs update. */
    public function flowConfigsUpdate(string $flowConfigId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/flow_configs/{flowConfigId}', ['flowConfigId' => $this->serializePathParameter($flowConfigId, new PathParameterSpec('flowConfigId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth grants list. */
    public function grantsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/grants';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth grants delete. */
    public function grantsDelete(string $grantId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/grants/{grantId}', ['grantId' => $this->serializePathParameter($grantId, new PathParameterSpec('grantId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth integrations list. */
    public function integrationsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/integrations';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth integrations create. */
    public function integrationsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/integrations';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth integrations delete. */
    public function integrationsDelete(string $integrationId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/integrations/{integrationId}', ['integrationId' => $this->serializePathParameter($integrationId, new PathParameterSpec('integrationId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth integrations retrieve. */
    public function integrationsRetrieve(string $integrationId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/integrations/{integrationId}', ['integrationId' => $this->serializePathParameter($integrationId, new PathParameterSpec('integrationId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth integrations update. */
    public function integrationsUpdate(string $integrationId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/integrations/{integrationId}', ['integrationId' => $this->serializePathParameter($integrationId, new PathParameterSpec('integrationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operational Resources list. */
    public function operationalResourcesList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/operational_resources';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operational Resources create. */
    public function operationalResourcesCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/operational_resources';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operational Resources delete. */
    public function operationalResourcesDelete(string $resourceId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/operational_resources/{resourceId}', ['resourceId' => $this->serializePathParameter($resourceId, new PathParameterSpec('resourceId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operational Resources update. */
    public function operationalResourcesUpdate(string $resourceId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/operational_resources/{resourceId}', ['resourceId' => $this->serializePathParameter($resourceId, new PathParameterSpec('resourceId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operational Resources publishes create. */
    public function operationalResourcesPublishesCreate(string $resourceId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/operational_resources/{resourceId}/publishes', ['resourceId' => $this->serializePathParameter($resourceId, new PathParameterSpec('resourceId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operator Platforms list. */
    public function operatorPlatformsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/operator_platforms';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operator Platforms create. */
    public function operatorPlatformsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/operator_platforms';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operator Platforms update. */
    public function operatorPlatformsUpdate(string $operatorPlatformId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}', ['operatorPlatformId' => $this->serializePathParameter($operatorPlatformId, new PathParameterSpec('operatorPlatformId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth operator Platforms pre Authorizations create. */
    public function operatorPlatformsPreAuthorizationsCreate(string $operatorPlatformId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}/pre_authorizations', ['operatorPlatformId' => $this->serializePathParameter($operatorPlatformId, new PathParameterSpec('operatorPlatformId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth policies list. */
    public function policiesList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/policies';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth policies create. */
    public function policiesCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/policies';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth policies update. */
    public function policiesUpdate(string $policyId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/policies/{policyId}', ['policyId' => $this->serializePathParameter($policyId, new PathParameterSpec('policyId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth provider Catalog list. */
    public function providerCatalogList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/provider_catalog';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth provider Catalog create. */
    public function providerCatalogCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/provider_catalog';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth provider Catalog retrieve. */
    public function providerCatalogRetrieve(string $providerCatalogId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/provider_catalog/{providerCatalogId}', ['providerCatalogId' => $this->serializePathParameter($providerCatalogId, new PathParameterSpec('providerCatalogId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth provider Catalog update. */
    public function providerCatalogUpdate(string $providerCatalogId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/provider_catalog/{providerCatalogId}', ['providerCatalogId' => $this->serializePathParameter($providerCatalogId, new PathParameterSpec('providerCatalogId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Accounts list. */
    public function resourceAccountsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/resource_accounts';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Accounts create. */
    public function resourceAccountsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/resource_accounts';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Accounts update. */
    public function resourceAccountsUpdate(string $resourceAccountId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}', ['resourceAccountId' => $this->serializePathParameter($resourceAccountId, new PathParameterSpec('resourceAccountId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Accounts authorization Refreshes create. */
    public function resourceAccountsAuthorizationRefreshesCreate(string $resourceAccountId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/authorization_refreshes', ['resourceAccountId' => $this->serializePathParameter($resourceAccountId, new PathParameterSpec('resourceAccountId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Accounts mini Program Login Checks create. */
    public function resourceAccountsMiniProgramLoginChecksCreate(string $resourceAccountId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/mini_program_login_checks', ['resourceAccountId' => $this->serializePathParameter($resourceAccountId, new PathParameterSpec('resourceAccountId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Accounts verifications create. */
    public function resourceAccountsVerificationsCreate(string $resourceAccountId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/verifications', ['resourceAccountId' => $this->serializePathParameter($resourceAccountId, new PathParameterSpec('resourceAccountId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Authorizations list. */
    public function resourceAuthorizationsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/resource_authorizations';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Authorizations create. */
    public function resourceAuthorizationsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/resource_authorizations';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth resource Authorizations update. */
    public function resourceAuthorizationsUpdate(string $authorizationId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/resource_authorizations/{authorizationId}', ['authorizationId' => $this->serializePathParameter($authorizationId, new PathParameterSpec('authorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth scope Profiles list. */
    public function scopeProfilesList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/scope_profiles';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth scope Profiles create. */
    public function scopeProfilesCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/scope_profiles';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth scope Profiles update. */
    public function scopeProfilesUpdate(string $scopeProfileId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/scope_profiles/{scopeProfileId}', ['scopeProfileId' => $this->serializePathParameter($scopeProfileId, new PathParameterSpec('scopeProfileId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth secrets list. */
    public function secretsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/secrets';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth secrets create. */
    public function secretsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/secrets';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth secrets delete. */
    public function secretsDelete(string $secretId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/secrets/{secretId}', ['secretId' => $this->serializePathParameter($secretId, new PathParameterSpec('secretId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth surfaces list. */
    public function surfacesList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/surfaces';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth surfaces create. */
    public function surfacesCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/surfaces';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth surfaces delete. */
    public function surfacesDelete(string $surfaceId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/surfaces/{surfaceId}', ['surfaceId' => $this->serializePathParameter($surfaceId, new PathParameterSpec('surfaceId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth surfaces update. */
    public function surfacesUpdate(string $surfaceId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/surfaces/{surfaceId}', ['surfaceId' => $this->serializePathParameter($surfaceId, new PathParameterSpec('surfaceId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth tenant Bindings list. */
    public function tenantBindingsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/tenant_bindings';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth tenant Bindings create. */
    public function tenantBindingsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/tenant_bindings';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth tenant Bindings update. */
    public function tenantBindingsUpdate(string $bindingId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/tenant_bindings/{bindingId}', ['bindingId' => $this->serializePathParameter($bindingId, new PathParameterSpec('bindingId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth webhook Configs list. */
    public function webhookConfigsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/webhook_configs';
        $query = $this->buildQueryString([
            new QueryParameterSpec('page', $page, 'form', true, false, null),
            new QueryParameterSpec('page_size', $pageSize, 'form', true, false, null),
            new QueryParameterSpec('cursor', $cursor, 'form', true, false, null),
            new QueryParameterSpec('sort', $sort, 'form', true, false, null),
            new QueryParameterSpec('q', $q, 'form', true, false, null),
        ]);
        $path = $this->appendQueryString($path, $query);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth webhook Configs create. */
    public function webhookConfigsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/oauth/webhook_configs';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth webhook Configs update. */
    public function webhookConfigsUpdate(string $webhookConfigId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/webhook_configs/{webhookConfigId}', ['webhookConfigId' => $this->serializePathParameter($webhookConfigId, new PathParameterSpec('webhookConfigId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth webhook Configs verifications create. */
    public function webhookConfigsVerificationsCreate(string $webhookConfigId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/oauth/webhook_configs/{webhookConfigId}/verifications', ['webhookConfigId' => $this->serializePathParameter($webhookConfigId, new PathParameterSpec('webhookConfigId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
