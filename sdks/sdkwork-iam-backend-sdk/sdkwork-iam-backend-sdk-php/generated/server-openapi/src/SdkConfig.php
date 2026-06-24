<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\BackendSdk;

final class SdkConfig
{
    public function __construct(
        public string $baseUrl = 'http://localhost:8080',
        public int $timeout = 30,
        public array $headers = [],
        public array $transportOptions = [],
    ) {
    }
}
