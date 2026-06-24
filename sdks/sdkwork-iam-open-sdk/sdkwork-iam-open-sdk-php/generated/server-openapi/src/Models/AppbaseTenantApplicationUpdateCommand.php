<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\OpenSdk\Models;

/**
 * Update tenant application access and runtime configuration.
 */
final class AppbaseTenantApplicationUpdateCommand
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

    public ?string $primaryDomain = null;

    public array $domainConfig = [];

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
        $this->primaryDomain = array_key_exists('primaryDomain', $data)
            ? $data['primaryDomain']
            : null;
        $this->domainConfig = array_key_exists('domainConfig', $data)
            ? is_array($data['domainConfig']) ? $data['domainConfig'] : []
            : [];
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
            'primaryDomain' => $this->primaryDomain,
            'domainConfig' => $this->domainConfig,
            'accessPermissions' => array_values(array_map(static fn($item) => $item, $this->accessPermissions)),
            'runtimeConfig' => $this->runtimeConfig,
        ];
    }
}
