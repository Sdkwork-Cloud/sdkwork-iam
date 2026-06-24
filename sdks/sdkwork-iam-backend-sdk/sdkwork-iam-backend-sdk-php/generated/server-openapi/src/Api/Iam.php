<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\BackendSdk\Api;

use SDKWork\\Iam\\BackendSdk\Models\AppbaseAccessCredentialCreateCommand;
use SDKWork\\Iam\\BackendSdk\Models\AppbaseApiResult;
use SDKWork\\Iam\\BackendSdk\Models\AppbaseApplicationRegisterCommand;
use SDKWork\\Iam\\BackendSdk\Models\AppbaseTenantApplicationEnableCommand;
use SDKWork\\Iam\\BackendSdk\Models\AppbaseTenantApplicationProvisionCommand;
use SDKWork\\Iam\\BackendSdk\Models\AppbaseTenantApplicationUpdateCommand;

final class IamApi extends BaseApi
{
    /** Access Credentials create. */
    public function accessCredentialsCreate(array|AppbaseAccessCredentialCreateCommand $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/access_credentials';
        $payload = $body instanceof AppbaseAccessCredentialCreateCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Account Binding Policy retrieve. */
    public function accountBindingPolicyRetrieve(): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/account_binding_policy';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Account Binding Policy update. */
    public function accountBindingPolicyUpdate(?array $body = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/account_binding_policy';
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Api Keys list. */
    public function apiKeysList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/api_keys';
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

    /** Api Keys revoke. */
    public function apiKeysRevoke(string $apiKeyId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/api_keys/{apiKeyId}/revoke', ['apiKeyId' => $this->serializePathParameter($apiKeyId, new PathParameterSpec('apiKeyId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Applications register. */
    public function applicationsRegister(array|AppbaseApplicationRegisterCommand $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/applications/register';
        $payload = $body instanceof AppbaseApplicationRegisterCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Audit Events list. */
    public function auditEventsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/audit_events';
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

    /** Department Assignments list. */
    public function departmentAssignmentsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/department_assignments';
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

    /** Department Assignments create. */
    public function departmentAssignmentsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/department_assignments';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Department Assignments update. */
    public function departmentAssignmentsUpdate(string $assignmentId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/department_assignments/{assignmentId}', ['assignmentId' => $this->serializePathParameter($assignmentId, new PathParameterSpec('assignmentId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Departments list. */
    public function departmentsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/departments';
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

    /** Departments create. */
    public function departmentsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/departments';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Departments delete. */
    public function departmentsDelete(string $departmentId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/departments/{departmentId}', ['departmentId' => $this->serializePathParameter($departmentId, new PathParameterSpec('departmentId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Departments retrieve. */
    public function departmentsRetrieve(string $departmentId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/departments/{departmentId}', ['departmentId' => $this->serializePathParameter($departmentId, new PathParameterSpec('departmentId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Departments update. */
    public function departmentsUpdate(string $departmentId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/departments/{departmentId}', ['departmentId' => $this->serializePathParameter($departmentId, new PathParameterSpec('departmentId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Departments tree retrieve. */
    public function departmentsTreeRetrieve(): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/departments/tree';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Groups list. */
    public function groupsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/groups';
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

    /** Groups create. */
    public function groupsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/groups';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Groups delete. */
    public function groupsDelete(string $groupId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/groups/{groupId}', ['groupId' => $this->serializePathParameter($groupId, new PathParameterSpec('groupId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Groups retrieve. */
    public function groupsRetrieve(string $groupId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/groups/{groupId}', ['groupId' => $this->serializePathParameter($groupId, new PathParameterSpec('groupId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Groups update. */
    public function groupsUpdate(string $groupId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/groups/{groupId}', ['groupId' => $this->serializePathParameter($groupId, new PathParameterSpec('groupId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Groups members list. */
    public function groupsMembersList(string $groupId, ?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/groups/{groupId}/members', ['groupId' => $this->serializePathParameter($groupId, new PathParameterSpec('groupId', 'simple', false))]);
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

    /** Groups members create. */
    public function groupsMembersCreate(string $groupId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/groups/{groupId}/members', ['groupId' => $this->serializePathParameter($groupId, new PathParameterSpec('groupId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Groups members delete. */
    public function groupsMembersDelete(string $groupId, string $memberId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/groups/{groupId}/members/{memberId}', ['groupId' => $this->serializePathParameter($groupId, new PathParameterSpec('groupId', 'simple', false)), 'memberId' => $this->serializePathParameter($memberId, new PathParameterSpec('memberId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organization Memberships list. */
    public function organizationMembershipsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/organization_memberships';
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

    /** Organization Memberships create. */
    public function organizationMembershipsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/organization_memberships';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organization Memberships update. */
    public function organizationMembershipsUpdate(string $membershipId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/organization_memberships/{membershipId}', ['membershipId' => $this->serializePathParameter($membershipId, new PathParameterSpec('membershipId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organizations list. */
    public function organizationsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/organizations';
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

    /** Organizations create. */
    public function organizationsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/organizations';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organizations delete. */
    public function organizationsDelete(string $organizationId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/organizations/{organizationId}', ['organizationId' => $this->serializePathParameter($organizationId, new PathParameterSpec('organizationId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organizations retrieve. */
    public function organizationsRetrieve(string $organizationId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/organizations/{organizationId}', ['organizationId' => $this->serializePathParameter($organizationId, new PathParameterSpec('organizationId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organizations update. */
    public function organizationsUpdate(string $organizationId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/organizations/{organizationId}', ['organizationId' => $this->serializePathParameter($organizationId, new PathParameterSpec('organizationId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Organizations tree retrieve. */
    public function organizationsTreeRetrieve(): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/organizations/tree';
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Permissions list. */
    public function permissionsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/permissions';
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

    /** Permissions create. */
    public function permissionsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/permissions';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Permissions delete. */
    public function permissionsDelete(string $permissionId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/permissions/{permissionId}', ['permissionId' => $this->serializePathParameter($permissionId, new PathParameterSpec('permissionId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Permissions retrieve. */
    public function permissionsRetrieve(string $permissionId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/permissions/{permissionId}', ['permissionId' => $this->serializePathParameter($permissionId, new PathParameterSpec('permissionId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Permissions update. */
    public function permissionsUpdate(string $permissionId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/permissions/{permissionId}', ['permissionId' => $this->serializePathParameter($permissionId, new PathParameterSpec('permissionId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Policies list. */
    public function policiesList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/policies';
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

    /** Policies create. */
    public function policiesCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/policies';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Policies delete. */
    public function policiesDelete(string $policyId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/policies/{policyId}', ['policyId' => $this->serializePathParameter($policyId, new PathParameterSpec('policyId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Policies retrieve. */
    public function policiesRetrieve(string $policyId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/policies/{policyId}', ['policyId' => $this->serializePathParameter($policyId, new PathParameterSpec('policyId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Policies update. */
    public function policiesUpdate(string $policyId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/policies/{policyId}', ['policyId' => $this->serializePathParameter($policyId, new PathParameterSpec('policyId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Position Assignments list. */
    public function positionAssignmentsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/position_assignments';
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

    /** Position Assignments create. */
    public function positionAssignmentsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/position_assignments';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Position Assignments update. */
    public function positionAssignmentsUpdate(string $assignmentId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/position_assignments/{assignmentId}', ['assignmentId' => $this->serializePathParameter($assignmentId, new PathParameterSpec('assignmentId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Positions list. */
    public function positionsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/positions';
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

    /** Positions create. */
    public function positionsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/positions';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Positions delete. */
    public function positionsDelete(string $positionId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/positions/{positionId}', ['positionId' => $this->serializePathParameter($positionId, new PathParameterSpec('positionId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Positions update. */
    public function positionsUpdate(string $positionId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/positions/{positionId}', ['positionId' => $this->serializePathParameter($positionId, new PathParameterSpec('positionId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Role Bindings list. */
    public function roleBindingsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/role_bindings';
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

    /** Role Bindings create. */
    public function roleBindingsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/role_bindings';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Role Bindings delete. */
    public function roleBindingsDelete(string $roleBindingId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/role_bindings/{roleBindingId}', ['roleBindingId' => $this->serializePathParameter($roleBindingId, new PathParameterSpec('roleBindingId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Roles list. */
    public function rolesList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/roles';
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

    /** Roles create. */
    public function rolesCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/roles';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Roles delete. */
    public function rolesDelete(string $roleId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/roles/{roleId}', ['roleId' => $this->serializePathParameter($roleId, new PathParameterSpec('roleId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Roles retrieve. */
    public function rolesRetrieve(string $roleId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/roles/{roleId}', ['roleId' => $this->serializePathParameter($roleId, new PathParameterSpec('roleId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Roles update. */
    public function rolesUpdate(string $roleId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/roles/{roleId}', ['roleId' => $this->serializePathParameter($roleId, new PathParameterSpec('roleId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Roles permissions list. */
    public function rolesPermissionsList(string $roleId, ?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/roles/{roleId}/permissions', ['roleId' => $this->serializePathParameter($roleId, new PathParameterSpec('roleId', 'simple', false))]);
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

    /** Roles permissions create. */
    public function rolesPermissionsCreate(string $roleId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/roles/{roleId}/permissions', ['roleId' => $this->serializePathParameter($roleId, new PathParameterSpec('roleId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Roles permissions delete. */
    public function rolesPermissionsDelete(string $roleId, string $permissionId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/roles/{roleId}/permissions/{permissionId}', ['roleId' => $this->serializePathParameter($roleId, new PathParameterSpec('roleId', 'simple', false)), 'permissionId' => $this->serializePathParameter($permissionId, new PathParameterSpec('permissionId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Security Events list. */
    public function securityEventsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/security_events';
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

    /** Service Accounts list. */
    public function serviceAccountsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/service_accounts';
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

    /** Service Accounts create. */
    public function serviceAccountsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/service_accounts';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Service Accounts delete. */
    public function serviceAccountsDelete(string $serviceAccountId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/service_accounts/{serviceAccountId}', ['serviceAccountId' => $this->serializePathParameter($serviceAccountId, new PathParameterSpec('serviceAccountId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Service Accounts retrieve. */
    public function serviceAccountsRetrieve(string $serviceAccountId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/service_accounts/{serviceAccountId}', ['serviceAccountId' => $this->serializePathParameter($serviceAccountId, new PathParameterSpec('serviceAccountId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Service Accounts update. */
    public function serviceAccountsUpdate(string $serviceAccountId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/service_accounts/{serviceAccountId}', ['serviceAccountId' => $this->serializePathParameter($serviceAccountId, new PathParameterSpec('serviceAccountId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenant Applications provision. */
    public function tenantApplicationsProvision(array|AppbaseTenantApplicationProvisionCommand $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/tenant_applications';
        $payload = $body instanceof AppbaseTenantApplicationProvisionCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenant Applications update. */
    public function tenantApplicationsUpdate(string $tenantApplicationId, array|AppbaseTenantApplicationUpdateCommand|null $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenant_applications/{tenantApplicationId}', ['tenantApplicationId' => $this->serializePathParameter($tenantApplicationId, new PathParameterSpec('tenantApplicationId', 'simple', false))]);
        $payload = $body instanceof AppbaseTenantApplicationUpdateCommand ? $body->toArray() : $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenant Applications enable. */
    public function tenantApplicationsEnable(string $tenantApplicationId, array|AppbaseTenantApplicationEnableCommand $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenant_applications/{tenantApplicationId}/enable', ['tenantApplicationId' => $this->serializePathParameter($tenantApplicationId, new PathParameterSpec('tenantApplicationId', 'simple', false))]);
        $payload = $body instanceof AppbaseTenantApplicationEnableCommand ? $body->toArray() : $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants list. */
    public function tenantsList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/tenants';
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

    /** Tenants create. */
    public function tenantsCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/tenants';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants delete. */
    public function tenantsDelete(string $tenantId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants retrieve. */
    public function tenantsRetrieve(string $tenantId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants update. */
    public function tenantsUpdate(string $tenantId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants members list. */
    public function tenantsMembersList(string $tenantId, ?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}/members', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false))]);
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

    /** Tenants members create. */
    public function tenantsMembersCreate(string $tenantId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}/members', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants members delete. */
    public function tenantsMembersDelete(string $tenantId, string $userId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}/members/{userId}', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false)), 'userId' => $this->serializePathParameter($userId, new PathParameterSpec('userId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Tenants members update. */
    public function tenantsMembersUpdate(string $tenantId, string $userId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/tenants/{tenantId}/members/{userId}', ['tenantId' => $this->serializePathParameter($tenantId, new PathParameterSpec('tenantId', 'simple', false)), 'userId' => $this->serializePathParameter($userId, new PathParameterSpec('userId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users list. */
    public function usersList(?int $page = null, ?int $pageSize = null, ?string $cursor = null, ?string $sort = null, ?string $q = null): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/users';
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

    /** Users create. */
    public function usersCreate(array $body): ?AppbaseApiResult
    {
        $path = '/backend/v3/api/iam/users';
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users delete. */
    public function usersDelete(string $userId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/users/{userId}', ['userId' => $this->serializePathParameter($userId, new PathParameterSpec('userId', 'simple', false))]);
        $result = $this->client->request('DELETE', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users retrieve. */
    public function usersRetrieve(string $userId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/users/{userId}', ['userId' => $this->serializePathParameter($userId, new PathParameterSpec('userId', 'simple', false))]);
        $result = $this->client->request('GET', $path, []);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Users update. */
    public function usersUpdate(string $userId, ?array $body = null): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/backend/v3/api/iam/users/{userId}', ['userId' => $this->serializePathParameter($userId, new PathParameterSpec('userId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('PATCH', $path, [
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
