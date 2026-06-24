<?php

declare(strict_types=1);

namespace SDKWork\Appbase\AppSdk\Models;

final class AppbaseApiResult
{
    public ?string $code = null;

    public ?string $message = null;

    /** Server-owned request correlation id. */
    public ?string $requestId = null;

    public array $data = [];

    public function __construct(array $data = [])
    {
        $this->code = array_key_exists('code', $data)
            ? $data['code']
            : null;
        $this->message = array_key_exists('message', $data)
            ? $data['message']
            : null;
        $this->requestId = array_key_exists('requestId', $data)
            ? $data['requestId']
            : null;
        $this->data = array_key_exists('data', $data)
            ? is_array($data['data']) ? $data['data'] : []
            : [];
    }

    public static function fromArray(?array $data): ?self
    {
        return $data === null ? null : new self($data);
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'message' => $this->message,
            'requestId' => $this->requestId,
            'data' => $this->data,
        ];
    }
}
