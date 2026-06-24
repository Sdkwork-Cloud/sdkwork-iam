<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\BackendSdk;

use SDKWork\\Iam\\BackendSdk\Http\HttpClient;
use SDKWork\\Iam\\BackendSdk\Api\IamApi;
use SDKWork\\Iam\\BackendSdk\Api\IamOauthApi;

final class SdkworkBackendClient
{
    public HttpClient $http;
    public IamApi $iam;
    public IamOauthApi $iamOauth;

    public function __construct(SdkConfig $config)
    {
        $this->http = new HttpClient($config);
        $this->iam = new IamApi($this->http);
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
