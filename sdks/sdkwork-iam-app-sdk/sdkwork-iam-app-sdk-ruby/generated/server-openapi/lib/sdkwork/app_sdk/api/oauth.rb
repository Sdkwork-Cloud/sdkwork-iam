require_relative 'base_api'
require_relative '../models/appbase_session_create_command'
require_relative '../models/sdk_work_list_response'
require_relative '../models/sdk_work_resource_response'
require_relative '../models/wechat_mini_program_session_create_command'

module Sdkwork
  module AppSdk
    module Api
      class OauthApi < BaseApi
          # Account Links list.
          def account_links_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/oauth/account_links'
            query = build_query_string([
              QueryParameterSpec.new('page', page, 'form', true, false, nil),
              QueryParameterSpec.new('page_size', page_size, 'form', true, false, nil),
              QueryParameterSpec.new('cursor', cursor, 'form', true, false, nil),
              QueryParameterSpec.new('sort', sort, 'form', true, false, nil),
              QueryParameterSpec.new('q', q, 'form', true, false, nil),
            ])
            path = append_query_string(path, query)
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkListResponse.from_hash(result) : nil
          end

          # Account Links delete.
          def account_links_delete(account_link_id)
            path = interpolate_path('/app/v3/api/oauth/account_links/{accountLinkId}', accountLinkId: serialize_path_parameter(account_link_id, PathParameterSpec.new('accountLinkId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result
          end

          # Authorization Urls create.
          def authorization_urls_create(body: nil)
            path = '/app/v3/api/oauth/authorization_urls'
            payload = body
            options = {}
            options[:access_token_only] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Authorizations completions create.
          def authorizations_completions_create(authorization_state_id, body: nil)
            path = interpolate_path('/app/v3/api/oauth/authorizations/{authorizationStateId}/completions', authorizationStateId: serialize_path_parameter(authorization_state_id, PathParameterSpec.new('authorizationStateId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Callbacks retrieve.
          def callbacks_retrieve(provider_code)
            path = interpolate_path('/app/v3/api/oauth/callbacks/{providerCode}', providerCode: serialize_path_parameter(provider_code, PathParameterSpec.new('providerCode', 'simple', false)))
            options = {}
            options[:access_token_only] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Callbacks create.
          def callbacks_create(provider_code, body: nil)
            path = interpolate_path('/app/v3/api/oauth/callbacks/{providerCode}', providerCode: serialize_path_parameter(provider_code, PathParameterSpec.new('providerCode', 'simple', false)))
            payload = body
            options = {}
            options[:access_token_only] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Device Authorizations create.
          def device_authorizations_create(body: nil)
            path = '/app/v3/api/oauth/device_authorizations'
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Device Authorizations retrieve.
          def device_authorizations_retrieve(device_authorization_id)
            path = interpolate_path('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}', deviceAuthorizationId: serialize_path_parameter(device_authorization_id, PathParameterSpec.new('deviceAuthorizationId', 'simple', false)))
            options = {}
            options[:skip_auth] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Device Authorizations password Completions create.
          def device_authorizations_password_completions_create(device_authorization_id, body: nil)
            path = interpolate_path('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/password_completions', deviceAuthorizationId: serialize_path_parameter(device_authorization_id, PathParameterSpec.new('deviceAuthorizationId', 'simple', false)))
            payload = body
            options = {}
            options[:access_token_only] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Device Authorizations scans create.
          def device_authorizations_scans_create(device_authorization_id, body: nil)
            path = interpolate_path('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/scans', deviceAuthorizationId: serialize_path_parameter(device_authorization_id, PathParameterSpec.new('deviceAuthorizationId', 'simple', false)))
            payload = body
            options = {}
            options[:access_token_only] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Device Authorizations session Exchanges create.
          def device_authorizations_session_exchanges_create(device_authorization_id, body: nil)
            path = interpolate_path('/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/session_exchanges', deviceAuthorizationId: serialize_path_parameter(device_authorization_id, PathParameterSpec.new('deviceAuthorizationId', 'simple', false)))
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Grants list.
          def grants_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/oauth/grants'
            query = build_query_string([
              QueryParameterSpec.new('page', page, 'form', true, false, nil),
              QueryParameterSpec.new('page_size', page_size, 'form', true, false, nil),
              QueryParameterSpec.new('cursor', cursor, 'form', true, false, nil),
              QueryParameterSpec.new('sort', sort, 'form', true, false, nil),
              QueryParameterSpec.new('q', q, 'form', true, false, nil),
            ])
            path = append_query_string(path, query)
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkListResponse.from_hash(result) : nil
          end

          # Grants delete.
          def grants_delete(grant_id)
            path = interpolate_path('/app/v3/api/oauth/grants/{grantId}', grantId: serialize_path_parameter(grant_id, PathParameterSpec.new('grantId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result
          end

          # Mini Program Sessions create.
          def mini_program_sessions_create(body: nil)
            path = '/app/v3/api/oauth/mini_program_sessions'
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:access_token_only] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

          # Providers list.
          def providers_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/oauth/providers'
            query = build_query_string([
              QueryParameterSpec.new('page', page, 'form', true, false, nil),
              QueryParameterSpec.new('page_size', page_size, 'form', true, false, nil),
              QueryParameterSpec.new('cursor', cursor, 'form', true, false, nil),
              QueryParameterSpec.new('sort', sort, 'form', true, false, nil),
              QueryParameterSpec.new('q', q, 'form', true, false, nil),
            ])
            path = append_query_string(path, query)
            options = {}
            options[:access_token_only] = true
            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkListResponse.from_hash(result) : nil
          end

          # Sessions create.
          def sessions_create(body: nil)
            path = '/app/v3/api/oauth/sessions'
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:access_token_only] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::SdkWorkResourceResponse.from_hash(result) : nil
          end

      end
    end
  end
end
