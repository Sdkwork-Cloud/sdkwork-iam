<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Models;

/**
 * Session creation command for credential login and external user-center session exchange.
 */
final class AppbaseSessionCreateCommand
{
    /** Email credential used by standard password login. */
    public ?string $email = null;

    /** Username credential used by standard password login. */
    public ?string $username = null;

    /** Phone credential used by standard password login. */
    public ?string $phone = null;

    /** Write-only password credential used by standard password login. */
    public ?string $password = null;

    /** Opaque upstream credential used only by an external user-center session exchange. */
    public ?string $externalToken = null;

    /** External authority provider key used to select the configured bridge. */
    public ?string $providerKey = null;

    /** Verified tenant id supplied by an external user-center session exchange after upstream identity validation. */
    public ?string $tenantId = null;

    /** Verified organization id supplied by an external user-center session exchange when the upstream identity resolved an organization scope. */
    public ?string $organizationId = null;

    public function __construct(array $data = [])
    {
        $this->email = array_key_exists('email', $data)
            ? $data['email']
            : null;
        $this->username = array_key_exists('username', $data)
            ? $data['username']
            : null;
        $this->phone = array_key_exists('phone', $data)
            ? $data['phone']
            : null;
        $this->password = array_key_exists('password', $data)
            ? $data['password']
            : null;
        $this->externalToken = array_key_exists('externalToken', $data)
            ? $data['externalToken']
            : null;
        $this->providerKey = array_key_exists('providerKey', $data)
            ? $data['providerKey']
            : null;
        $this->tenantId = array_key_exists('tenantId', $data)
            ? $data['tenantId']
            : null;
        $this->organizationId = array_key_exists('organizationId', $data)
            ? $data['organizationId']
            : null;
    }

    public static function fromArray(?array $data): ?self
    {
        return $data === null ? null : new self($data);
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'username' => $this->username,
            'phone' => $this->phone,
            'password' => $this->password,
            'externalToken' => $this->externalToken,
            'providerKey' => $this->providerKey,
            'tenantId' => $this->tenantId,
            'organizationId' => $this->organizationId,
        ];
    }
}
