<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Api;

use SDKWork\\Iam\\AppSdk\Models\AppbaseApiResult;

final class OauthApi extends BaseApi
{
    /** Oauth account Links list. */
    public function accountLinksList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/account_links';
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

    /** Oauth account Links delete. */
    public function accountLinksDelete(string $accountLinkId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/account_links/{accountLinkId}', ['accountLinkId' => $this->serializePathParameter($accountLinkId, new PathParameterSpec('accountLinkId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth authorization Urls create. */
    public function authorizationUrlsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/authorization_urls';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth callbacks handle Get. */
    public function callbacksHandleGet(string $providerCode): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/callbacks/{providerCode}', ['providerCode' => $this->serializePathParameter($providerCode, new PathParameterSpec('providerCode', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth callbacks handle Post. */
    public function callbacksHandlePost(string $providerCode, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/callbacks/{providerCode}', ['providerCode' => $this->serializePathParameter($providerCode, new PathParameterSpec('providerCode', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth device Authorizations create. */
    public function deviceAuthorizationsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/device_authorizations';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth device Authorizations retrieve. */
    public function deviceAuthorizationsRetrieve(string $deviceAuthorizationId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $result = $this->client->request('GET', $path, [
            'skipAuth' => true,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth device Authorizations password Completions create. */
    public function deviceAuthorizationsPasswordCompletionsCreate(string $deviceAuthorizationId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/password_completions', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth device Authorizations scans create. */
    public function deviceAuthorizationsScansCreate(string $deviceAuthorizationId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/scans', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth device Authorizations session Exchanges create. */
    public function deviceAuthorizationsSessionExchangesCreate(string $deviceAuthorizationId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/session_exchanges', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth grants list. */
    public function grantsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/grants';
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

    /** Oauth grants delete. */
    public function grantsDelete(string $grantId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/grants/{grantId}', ['grantId' => $this->serializePathParameter($grantId, new PathParameterSpec('grantId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth mini Program Sessions create. */
    public function miniProgramSessionsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/mini_program_sessions';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Oauth providers list. */
    public function providersList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/providers';
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

    /** Oauth sessions create. */
    public function sessionsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/oauth/sessions';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
