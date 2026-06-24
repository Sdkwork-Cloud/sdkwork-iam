require_relative 'base_api'
require_relative '../models/appbase_api_result'

module Sdkwork
  module CustomSdk
    module Api
      class IamOauthApi < BaseApi
          # Iam oauth provider Callbacks handle Get.
          def provider_callbacks_handle_get(callback_public_id)
            path = interpolate_path('/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}', callbackPublicId: serialize_path_parameter(callback_public_id, PathParameterSpec.new('callbackPublicId', 'simple', false)))
            options = {}
            options[:skip_auth] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth provider Callbacks handle Post.
          def provider_callbacks_handle_post(callback_public_id, body: nil)
            path = interpolate_path('/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}', callbackPublicId: serialize_path_parameter(callback_public_id, PathParameterSpec.new('callbackPublicId', 'simple', false)))
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

      end
    end
  end
end
