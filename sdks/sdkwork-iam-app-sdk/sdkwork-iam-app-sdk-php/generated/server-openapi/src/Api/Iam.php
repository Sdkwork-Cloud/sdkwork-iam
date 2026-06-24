<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Api;

use SDKWork\\Iam\\AppSdk\Models\AppbaseApiResult;

final class IamApi extends BaseApi
{
    /** Department Assignments list. */
    public function departmentAssignmentsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/department_assignments';
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

    /** Departments list. */
    public function departmentsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/departments';
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

    /** Departments tree retrieve. */
    public function departmentsTreeRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/departments/tree';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organization Memberships list. */
    public function organizationMembershipsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/organization_memberships';
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

    /** Organizations list. */
    public function organizationsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/organizations';
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

    /** Organizations tree retrieve. */
    public function organizationsTreeRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/organizations/tree';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Position Assignments list. */
    public function positionAssignmentsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/position_assignments';
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

    /** Positions list. */
    public function positionsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/positions';
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

    /** Role Bindings list. */
    public function roleBindingsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/role_bindings';
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

    /** Users current retrieve. */
    public function usersCurrentRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users current update. */
    public function usersCurrentUpdate(?array $body = null): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current';
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users current email Bindings delete. */
    public function usersCurrentEmailBindingsDelete(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current/email_bindings';
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users current email Bindings create. */
    public function usersCurrentEmailBindingsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current/email_bindings';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users current password update. */
    public function usersCurrentPasswordUpdate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current/password';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users current phone Bindings delete. */
    public function usersCurrentPhoneBindingsDelete(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current/phone_bindings';
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users current phone Bindings create. */
    public function usersCurrentPhoneBindingsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/app/v3/api/iam/users/current/phone_bindings';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
