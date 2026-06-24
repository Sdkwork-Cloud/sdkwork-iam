require_relative 'base_api'
require_relative '../models/appbase_api_result'

module Sdkwork
  module AppSdk
    module Api
      class IamApi < BaseApi
          # Department Assignments list.
          def department_assignments_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/department_assignments'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments list.
          def departments_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/departments'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments tree retrieve.
          def departments_tree_retrieve()
            path = '/app/v3/api/iam/departments/tree'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organization Memberships list.
          def organization_memberships_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/organization_memberships'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations list.
          def organizations_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/organizations'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations tree retrieve.
          def organizations_tree_retrieve()
            path = '/app/v3/api/iam/organizations/tree'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Position Assignments list.
          def position_assignments_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/position_assignments'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Positions list.
          def positions_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/positions'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Role Bindings list.
          def role_bindings_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/app/v3/api/iam/role_bindings'
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
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current retrieve.
          def users_current_retrieve()
            path = '/app/v3/api/iam/users/current'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current update.
          def users_current_update(body: nil)
            path = '/app/v3/api/iam/users/current'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current email Bindings delete.
          def users_current_email_bindings_delete()
            path = '/app/v3/api/iam/users/current/email_bindings'
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current email Bindings create.
          def users_current_email_bindings_create(body: nil)
            path = '/app/v3/api/iam/users/current/email_bindings'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current password update.
          def users_current_password_update(body: nil)
            path = '/app/v3/api/iam/users/current/password'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current phone Bindings delete.
          def users_current_phone_bindings_delete()
            path = '/app/v3/api/iam/users/current/phone_bindings'
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users current phone Bindings create.
          def users_current_phone_bindings_create(body: nil)
            path = '/app/v3/api/iam/users/current/phone_bindings'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

      end
    end
  end
end
