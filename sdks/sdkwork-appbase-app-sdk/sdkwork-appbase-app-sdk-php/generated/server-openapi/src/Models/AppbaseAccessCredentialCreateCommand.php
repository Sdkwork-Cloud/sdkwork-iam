<?php

declare(strict_types=1);

namespace SDKWork\Appbase\AppSdk\Models;

/**
 * Issue a delegated access credential for an enabled tenant application.
 */
final class AppbaseAccessCredentialCreateCommand
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

    public ?string $tenantApplicationId = null;

    public ?string $appId = null;

    public ?string $instanceKey = null;

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
        $this->tenantApplicationId = array_key_exists('tenantApplicationId', $data)
            ? $data['tenantApplicationId']
            : null;
        $this->appId = array_key_exists('appId', $data)
            ? $data['appId']
            : null;
        $this->instanceKey = array_key_exists('instanceKey', $data)
            ? $data['instanceKey']
            : null;
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
            'tenantApplicationId' => $this->tenantApplicationId,
            'appId' => $this->appId,
            'instanceKey' => $this->instanceKey,
        ];
    }
}
