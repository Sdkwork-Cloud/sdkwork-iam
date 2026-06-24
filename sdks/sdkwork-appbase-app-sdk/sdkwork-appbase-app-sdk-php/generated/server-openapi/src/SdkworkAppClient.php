<?php

declare(strict_types=1);

namespace SDKWork\Appbase\AppSdk;

use SDKWork\Appbase\AppSdk\Http\HttpClient;
use SDKWork\Appbase\AppSdk\Api\AuthApi;
use SDKWork\Appbase\AppSdk\Api\IamApi;
use SDKWork\Appbase\AppSdk\Api\OauthApi;
use SDKWork\Appbase\AppSdk\Api\SystemApi;

final class SdkworkAppClient
{
    public HttpClient $http;
    public AuthApi $auth;
    public IamApi $iam;
    public OauthApi $oauth;
    public SystemApi $system;

    public function __construct(SdkConfig $config)
    {
        $this->http = new HttpClient($config);
        $this->auth = new AuthApi($this->http);
        $this->iam = new IamApi($this->http);
        $this->oauth = new OauthApi($this->http);
        $this->system = new SystemApi($this->http);
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
