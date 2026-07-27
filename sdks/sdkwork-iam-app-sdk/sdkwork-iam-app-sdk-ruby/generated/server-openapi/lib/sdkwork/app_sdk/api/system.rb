require_relative 'base_api'
require_relative '../models/sdk_work_resource_response'

module Sdkwork
  module AppSdk
    module Api
      class SystemApi < BaseApi
          # Iam account Binding Policy retrieve.
          def iam_account_binding_policy_retrieve()
            path = '/app/v3/api/system/iam/account_binding_policy'
            options = {}
            options[:access_token_only] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Iam runtime retrieve.
          def iam_runtime_retrieve()
            path = '/app/v3/api/system/iam/runtime'
            options = {}
            options[:access_token_only] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Iam verification Policy retrieve.
          def iam_verification_policy_retrieve()
            path = '/app/v3/api/system/iam/verification_policy'
            options = {}
            options[:access_token_only] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

      end
    end
  end
end
