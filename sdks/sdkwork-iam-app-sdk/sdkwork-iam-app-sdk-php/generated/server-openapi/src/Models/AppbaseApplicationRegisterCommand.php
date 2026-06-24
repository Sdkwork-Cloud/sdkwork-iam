<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Models;

/**
 * Super-admin registered application command for startup bootstrap.
 */
final class AppbaseApplicationRegisterCommand
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

    public ?string $ownerTenantId = null;

    public ?string $appKey = null;

    public ?string $name = null;

    public ?string $displayName = null;

    public ?string $appType = null;

    public ?string $packageName = null;

    public ?string $bundleId = null;

    public ?string $desktopAppId = null;

    public ?string $version = null;

    public ?string $channel = null;

    public ?string $manifestHash = null;

    public array $defaultAccessPermissions = [];

    public array $config = [];

    public array $packages = [];

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
        $this->ownerTenantId = array_key_exists('ownerTenantId', $data)
            ? $data['ownerTenantId']
            : null;
        $this->appKey = array_key_exists('appKey', $data)
            ? $data['appKey']
            : null;
        $this->name = array_key_exists('name', $data)
            ? $data['name']
            : null;
        $this->displayName = array_key_exists('displayName', $data)
            ? $data['displayName']
            : null;
        $this->appType = array_key_exists('appType', $data)
            ? $data['appType']
            : null;
        $this->packageName = array_key_exists('packageName', $data)
            ? $data['packageName']
            : null;
        $this->bundleId = array_key_exists('bundleId', $data)
            ? $data['bundleId']
            : null;
        $this->desktopAppId = array_key_exists('desktopAppId', $data)
            ? $data['desktopAppId']
            : null;
        $this->version = array_key_exists('version', $data)
            ? $data['version']
            : null;
        $this->channel = array_key_exists('channel', $data)
            ? $data['channel']
            : null;
        $this->manifestHash = array_key_exists('manifestHash', $data)
            ? $data['manifestHash']
            : null;
        $this->defaultAccessPermissions = array_key_exists('defaultAccessPermissions', $data)
            ? is_array($data['defaultAccessPermissions'])
                ? array_values(array_map(static fn($item) => $item, $data['defaultAccessPermissions']))
                : []
            : [];
        $this->config = array_key_exists('config', $data)
            ? is_array($data['config']) ? $data['config'] : []
            : [];
        $this->packages = array_key_exists('packages', $data)
            ? is_array($data['packages'])
                ? array_values(array_map(static fn($item) => is_array($item) ? $item : [], $data['packages']))
                : []
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
            'ownerTenantId' => $this->ownerTenantId,
            'appKey' => $this->appKey,
            'name' => $this->name,
            'displayName' => $this->displayName,
            'appType' => $this->appType,
            'packageName' => $this->packageName,
            'bundleId' => $this->bundleId,
            'desktopAppId' => $this->desktopAppId,
            'version' => $this->version,
            'channel' => $this->channel,
            'manifestHash' => $this->manifestHash,
            'defaultAccessPermissions' => array_values(array_map(static fn($item) => $item, $this->defaultAccessPermissions)),
            'config' => $this->config,
            'packages' => array_values(array_map(static fn($item) => $item, $this->packages)),
        ];
    }
}
