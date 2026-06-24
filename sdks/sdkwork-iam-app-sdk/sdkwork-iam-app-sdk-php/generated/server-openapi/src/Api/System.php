<?php

declare(strict_types=1);

namespace SDKWork\\Iam\\AppSdk\Api;

use SDKWork\\Iam\\AppSdk\Models\AppbaseApiResult;

final class SystemApi extends BaseApi
{
    /** Iam account Binding Policy retrieve. */
    public function iamAccountBindingPolicyRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/system/iam/account_binding_policy';
        $result = $this->client->request('GET', $path, [
            'skipAuth' => true,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam runtime retrieve. */
    public function iamRuntimeRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/system/iam/runtime';
        $result = $this->client->request('GET', $path, [
            'skipAuth' => true,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

    /** Iam verification Policy retrieve. */
    public function iamVerificationPolicyRetrieve(): ?AppbaseApiResult
    {
        $path = '/app/v3/api/system/iam/verification_policy';
        $result = $this->client->request('GET', $path, [
            'skipAuth' => true,
        ]);
        return is_array($result) ? AppbaseApiResult::fromArray($result) : null;
    }

}
