<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Api;

use SDKWork\\Iam\\AppSdk\Models\SdkWorkResourceResponse;

final class SystemApi extends BaseApi
{
    /** Iam account Binding Policy retrieve. */
    public function iamAccountBindingPolicyRetrieve(): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/system/iam/account_binding_policy';
        $result = $this->client->request('GET', $path, [
            'accessTokenOnly' => true,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Iam runtime retrieve. */
    public function iamRuntimeRetrieve(): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/system/iam/runtime';
        $result = $this->client->request('GET', $path, [
            'accessTokenOnly' => true,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

    /** Iam verification Policy retrieve. */
    public function iamVerificationPolicyRetrieve(): ?SdkWorkResourceResponse
    {
        $path = '/app/v3/api/system/iam/verification_policy';
        $result = $this->client->request('GET', $path, [
            'accessTokenOnly' => true,
        ]);
        return is_array($result) ? SdkWorkResourceResponse::fromArray($result) : null;
    }

}
