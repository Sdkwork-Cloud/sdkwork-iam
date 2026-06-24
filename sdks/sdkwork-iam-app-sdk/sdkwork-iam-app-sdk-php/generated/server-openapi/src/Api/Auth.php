<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Api;

use SDKWork\\Iam\\AppSdk\Models\AppbaseApiResult;
use SDKWork\\Iam\\AppSdk\Models\AppbaseSessionCreateCommand;

final class AuthApi extends BaseApi
{
    /** Password Reset Requests create. */
    public function passwordResetRequestsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/password_reset_requests';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Password Resets create. */
    public function passwordResetsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/password_resets';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Registrations create. */
    public function registrationsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/registrations';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions create. */
    public function sessionsCreate(array|AppbaseSessionCreateCommand $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions';
        $payload = $body instanceof AppbaseSessionCreateCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions current delete. */
    public function sessionsCurrentDelete(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions/current';
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions current retrieve. */
    public function sessionsCurrentRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions/current';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions current update. */
    public function sessionsCurrentUpdate(?array $body = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions/current';
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions login Context Selection create. */
    public function sessionsLoginContextSelectionCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions/login_context_selection';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions organization Selection create. */
    public function sessionsOrganizationSelectionCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions/organization_selection';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Sessions refresh. */
    public function sessionsRefresh(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/auth/sessions/refresh';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
