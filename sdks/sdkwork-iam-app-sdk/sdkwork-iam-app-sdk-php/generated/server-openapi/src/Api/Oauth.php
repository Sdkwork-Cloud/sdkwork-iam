<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Api;

use SDKWork\\Iam\\AppSdk\Models\AppbaseSessionCreateCommand;
use SDKWork\\Iam\\AppSdk\Models\SdkWorkListResponse;
use SDKWork\\Iam\\AppSdk\Models\SdkWorkResourceResponse;
use SDKWork\\Iam\\AppSdk\Models\WechatMiniProgramSessionCreateCommand;

final class OauthApi extends BaseApi
{
    /** Account Links list. */
    public function accountLinksList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?SdkWorkListResponse
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
        return is_array($result) ? SdkWorkListResponse::fromArray($result) : null;
    }

    /** Account Links delete. */
    public function accountLinksDelete(string $accountLinkId): mixed
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/account_links/{accountLinkId}', ['accountLinkId' => $this->serializePathParameter($accountLinkId, new PathParameterSpec('accountLinkId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return $result;
    }

    /** Authorization Urls create. */
    public function authorizationUrlsCreate(array $body): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/oauth/authorization_urls';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'accessTokenOnly' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Authorizations completions create. */
    public function authorizationsCompletionsCreate(string $authorizationStateId, array $body): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/authorizations/{authorizationStateId}/completions', ['authorizationStateId' => $this->serializePathParameter($authorizationStateId, new PathParameterSpec('authorizationStateId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Callbacks retrieve. */
    public function callbacksRetrieve(string $providerCode): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/callbacks/{providerCode}', ['providerCode' => $this->serializePathParameter($providerCode, new PathParameterSpec('providerCode', 'simple', false))]);
        $result = $this->client->request('GET', $path, [
            'accessTokenOnly' => true,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Callbacks create. */
    public function callbacksCreate(string $providerCode, array $body): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/callbacks/{providerCode}', ['providerCode' => $this->serializePathParameter($providerCode, new PathParameterSpec('providerCode', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'accessTokenOnly' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Device Authorizations create. */
    public function deviceAuthorizationsCreate(array $body): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/oauth/device_authorizations';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Device Authorizations retrieve. */
    public function deviceAuthorizationsRetrieve(string $deviceAuthorizationId): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $result = $this->client->request('GET', $path, [
            'skipAuth' => true,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Device Authorizations password Completions create. */
    public function deviceAuthorizationsPasswordCompletionsCreate(string $deviceAuthorizationId, array $body): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/password_completions', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'accessTokenOnly' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Device Authorizations scans create. */
    public function deviceAuthorizationsScansCreate(string $deviceAuthorizationId, array $body): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/scans', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'accessTokenOnly' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Device Authorizations session Exchanges create. */
    public function deviceAuthorizationsSessionExchangesCreate(string $deviceAuthorizationId, array $body): ?SdkWorkResourceResponse
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/session_exchanges', ['deviceAuthorizationId' => $this->serializePathParameter($deviceAuthorizationId, new PathParameterSpec('deviceAuthorizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Grants list. */
    public function grantsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?SdkWorkListResponse
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
        return is_array($result) ? SdkWorkListResponse::fromArray($result) : null;
    }

    /** Grants delete. */
    public function grantsDelete(string $grantId): mixed
    {
        $path = $this->interpolatePath('/app/v3/api/oauth/grants/{grantId}', ['grantId' => $this->serializePathParameter($grantId, new PathParameterSpec('grantId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return $result;
    }

    /** Mini Program Sessions create. */
    public function miniProgramSessionsCreate(array|WechatMiniProgramSessionCreateCommand $body): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/oauth/mini_program_sessions';
        $payload = $body instanceof WechatMiniProgramSessionCreateCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'accessTokenOnly' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Providers list. */
    public function providersList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?SdkWorkListResponse
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
        $result = $this->client->request('GET', $path, [
            'accessTokenOnly' => true,
        ]);
        return is_array($result) ? SdkWorkListResponse::fromArray($result) : null;
    }

    /** Sessions create. */
    public function sessionsCreate(array|AppbaseSessionCreateCommand $body): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/oauth/sessions';
        $payload = $body instanceof AppbaseSessionCreateCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'accessTokenOnly' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

}
