<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Models;

/**
 * One-time WeChat Mini Program login-code exchange command.
 */
final class WechatMiniProgramSessionCreateCommand
{
    /** One-time code returned by wx.login(). */
    public ?string $jsCode = null;

    public ?string $providerCode = null;

    /** Registered IAM OAuth mini-program surface code. */
    public ?string $surfaceCode = null;

    public function __construct(array $data = [])
    {
        $this->jsCode = array_key_exists('jsCode', $data)
            ? $data['jsCode']
            : null;
        $this->providerCode = array_key_exists('providerCode', $data)
            ? $data['providerCode']
            : null;
        $this->surfaceCode = array_key_exists('surfaceCode', $data)
            ? $data['surfaceCode']
            : null;
    }

    public static function fromArray(?array $data): ?self
    {
        return $data === null ? null : new self($data);
    }

    public function toArray(): array
    {
        return [
            'jsCode' => $this->jsCode,
            'providerCode' => $this->providerCode,
            'surfaceCode' => $this->surfaceCode,
        ];
    }
}
