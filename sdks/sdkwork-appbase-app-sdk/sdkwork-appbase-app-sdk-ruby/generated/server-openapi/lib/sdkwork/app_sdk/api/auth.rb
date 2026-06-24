require_relative 'base_api'
require_relative '../models/appbase_api_result'
require_relative '../models/appbase_session_create_command'

module Sdkwork
  module AppSdk
    module Api
      class AuthApi < BaseApi
          # Password Reset Requests create.
          def password_reset_requests_create(body: nil)
            path = '/app/v3/api/auth/password_reset_requests'
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Password Resets create.
          def password_resets_create(body: nil)
            path = '/app/v3/api/auth/password_resets'
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Registrations create.
          def registrations_create(body: nil)
            path = '/app/v3/api/auth/registrations'
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions create.
          def sessions_create(body: nil)
            path = '/app/v3/api/auth/sessions'
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions current delete.
          def sessions_current_delete()
            path = '/app/v3/api/auth/sessions/current'
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions current retrieve.
          def sessions_current_retrieve()
            path = '/app/v3/api/auth/sessions/current'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions current update.
          def sessions_current_update(body: nil)
            path = '/app/v3/api/auth/sessions/current'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions login Context Selection create.
          def sessions_login_context_selection_create(body: nil)
            path = '/app/v3/api/auth/sessions/login_context_selection'
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions organization Selection create.
          def sessions_organization_selection_create(body: nil)
            path = '/app/v3/api/auth/sessions/organization_selection'
            payload = body
            options = {}
            options[:skip_auth] = true
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Sessions refresh.
          def sessions_refresh(body: nil)
            path = '/app/v3/api/auth/sessions/refresh'
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
