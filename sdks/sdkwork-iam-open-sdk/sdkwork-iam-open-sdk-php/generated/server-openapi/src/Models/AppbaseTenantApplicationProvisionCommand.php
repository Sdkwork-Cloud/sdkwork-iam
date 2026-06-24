<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\OpenSdk\Models;

/**
 * Provision a tenant application from a registered application template.
 */
final class AppbaseTenantApplicationProvisionCommand
{
    /** Super-admin auth token used for bootstrap body authentication. */
    public ?string $authToken = null;

    /** Super-admin username credential for bootstrap body authentication. */
    public ?string $username = null;

    /** Super-admin email credential for bootstrap body authentication. */
    public ?string $email = null;

    /** Super-admin phone credential for bootstrap body authentication. */
    public ?string $phone = null;

    /** Super-admin password credential for bootstrap body authentication. */
    public ?string $password = null;

    public ?string $tenantId = null;

    public ?string $organizationId = null;

    public ?string $templateId = null;

    public ?string $appKey = null;

    public ?string $instanceKey = null;

    public ?string $displayName = null;

    public ?string $environment = null;

    public ?string $primaryDomain = null;

    public array $accessPermissions = [];

    public array $runtimeConfig = [];

    public function __construct(array $data = [])
    {
        $this->authToken = array_key_exists('authToken', $data)
            ? $data['authToken']
            : null;
        $this->username = array_key_exists('username', $data)
            ? $data['username']
            : null;
        $this->email = array_key_exists('email', $data)
            ? $data['email']
            : null;
        $this->phone = array_key_exists('phone', $data)
            ? $data['phone']
            : null;
        $this->password = array_key_exists('password', $data)
            ? $data['password']
            : null;
        $this->tenantId = array_key_exists('tenantId', $data)
            ? $data['tenantId']
            : null;
        $this->organizationId = array_key_exists('organizationId', $data)
            ? $data['organizationId']
            : null;
        $this->templateId = array_key_exists('templateId', $data)
            ? $data['templateId']
            : null;
        $this->appKey = array_key_exists('appKey', $data)
            ? $data['appKey']
            : null;
        $this->instanceKey = array_key_exists('instanceKey', $data)
            ? $data['instanceKey']
            : null;
        $this->displayName = array_key_exists('displayName', $data)
            ? $data['displayName']
            : null;
        $this->environment = array_key_exists('environment', $data)
            ? $data['environment']
            : null;
        $this->primaryDomain = array_key_exists('primaryDomain', $data)
            ? $data['primaryDomain']
            : null;
        $this->accessPermissions = array_key_exists('accessPermissions', $data)
            ? is_array($data['accessPermissions'])
                ? array_values(array_map(static fn($item) => $item, $data['accessPermissions']))
                : []
            : [];
        $this->runtimeConfig = array_key_exists('runtimeConfig', $data)
            ? is_array($data['runtimeConfig']) ? $data['runtimeConfig'] : []
            : [];
    }

    public static function fromArray(?array $data): ?self
    {
        return $data === null ? null : new self($data);
    }

    public function toArray(): array
    {
        return [
            'authToken' => $this->authToken,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'password' => $this->password,
            'tenantId' => $this->tenantId,
            'organizationId' => $this->organizationId,
            'templateId' => $this->templateId,
            'appKey' => $this->appKey,
            'instanceKey' => $this->instanceKey,
            'displayName' => $this->displayName,
            'environment' => $this->environment,
            'primaryDomain' => $this->primaryDomain,
            'accessPermissions' => array_values(array_map(static fn($item) => $item, $this->accessPermissions)),
            'runtimeConfig' => $this->runtimeConfig,
        ];
    }
}
