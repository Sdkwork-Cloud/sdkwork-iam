<?php

declare(strict_types=1);

namespace SDKWork\Appbase\OpenSdk\Api;

use SDKWork\Appbase\OpenSdk\Models\AppbaseApiResult;

final class IamOauthApi extends BaseApi
{
    /** Iam oauth provider Callbacks handle Get. */
    public function providerCallbacksHandleGet(string $callbackPublicId): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}', ['callbackPublicId' => $this->serializePathParameter($callbackPublicId, new PathParameterSpec('callbackPublicId', 'simple', false))]);
        $result = $this->client->request('GET', $path, [
            'skipAuth' => true,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam oauth provider Callbacks handle Post. */
    public function providerCallbacksHandlePost(string $callbackPublicId, array $body): ?AppbaseApiResult
    {
        $path = $this->interpolatePath('/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}', ['callbackPublicId' => $this->serializePathParameter($callbackPublicId, new PathParameterSpec('callbackPublicId', 'simple', false))]);
        $payload = $body;
        $result = $this->client->request('POST', $path, [
            'skipAuth' => true,
            'json' => $payload,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
