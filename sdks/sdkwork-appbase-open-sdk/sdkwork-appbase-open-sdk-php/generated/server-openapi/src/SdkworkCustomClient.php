<?php

declare(strict_types=1);

namespace SDKWork\Appbase\OpenSdk;

use SDKWork\Appbase\OpenSdk\Http\HttpClient;
use SDKWork\Appbase\OpenSdk\Api\IamOauthApi;

final class SdkworkCustomClient
{
    public HttpClient $http;
    public IamOauthApi $iamOauth;

    public function __construct(SdkConfig $config)
    {
        $this->http = new HttpClient($config);
        $this->iamOauth = new IamOauthApi($this->http);
    }

    public function setApiKey(string $apiKey): self
    {
        $this->http->setApiKey($apiKey);
        return $this;
    }

    public function setAuthToken(string $token): self
    {
        $this->http->setAuthToken($token);
        return $this;
    }

    public function setAccessToken(string $token): self
    {
        $this->http->setAccessToken($token);
        return $this;
    }

    public function setHeader(string $key, string $value): self
    {
        $this->http->setHeader($key, $value);
        return $this;
    }
}
