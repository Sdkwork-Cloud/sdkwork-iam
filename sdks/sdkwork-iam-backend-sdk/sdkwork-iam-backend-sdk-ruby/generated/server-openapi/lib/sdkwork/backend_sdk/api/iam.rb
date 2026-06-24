require_relative 'base_api'
require_relative '../models/appbase_access_credential_create_command'
require_relative '../models/appbase_api_result'
require_relative '../models/appbase_application_register_command'
require_relative '../models/appbase_tenant_application_enable_command'
require_relative '../models/appbase_tenant_application_provision_command'
require_relative '../models/appbase_tenant_application_update_command'

module Sdkwork
  module BackendSdk
    module Api
      class IamApi < BaseApi
          # Access Credentials create.
          def access_credentials_create(body: nil)
            path = '/backend/v3/api/iam/access_credentials'
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Account Binding Policy retrieve.
          def account_binding_policy_retrieve()
            path = '/backend/v3/api/iam/account_binding_policy'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Account Binding Policy update.
          def account_binding_policy_update(body: nil)
            path = '/backend/v3/api/iam/account_binding_policy'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Api Keys list.
          def api_keys_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/api_keys'
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

          # Api Keys revoke.
          def api_keys_revoke(api_key_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/api_keys/{apiKeyId}/revoke', apiKeyId: serialize_path_parameter(api_key_id, PathParameterSpec.new('apiKeyId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Applications register.
          def applications_register(body: nil)
            path = '/backend/v3/api/iam/applications/register'
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Audit Events list.
          def audit_events_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/audit_events'
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

          # Department Assignments list.
          def department_assignments_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/department_assignments'
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

          # Department Assignments create.
          def department_assignments_create(body: nil)
            path = '/backend/v3/api/iam/department_assignments'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Department Assignments update.
          def department_assignments_update(assignment_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/department_assignments/{assignmentId}', assignmentId: serialize_path_parameter(assignment_id, PathParameterSpec.new('assignmentId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments list.
          def departments_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/departments'
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

          # Departments create.
          def departments_create(body: nil)
            path = '/backend/v3/api/iam/departments'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments delete.
          def departments_delete(department_id)
            path = interpolate_path('/backend/v3/api/iam/departments/{departmentId}', departmentId: serialize_path_parameter(department_id, PathParameterSpec.new('departmentId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments retrieve.
          def departments_retrieve(department_id)
            path = interpolate_path('/backend/v3/api/iam/departments/{departmentId}', departmentId: serialize_path_parameter(department_id, PathParameterSpec.new('departmentId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments update.
          def departments_update(department_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/departments/{departmentId}', departmentId: serialize_path_parameter(department_id, PathParameterSpec.new('departmentId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Departments tree retrieve.
          def departments_tree_retrieve()
            path = '/backend/v3/api/iam/departments/tree'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Groups list.
          def groups_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/groups'
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

          # Groups create.
          def groups_create(body: nil)
            path = '/backend/v3/api/iam/groups'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Groups delete.
          def groups_delete(group_id)
            path = interpolate_path('/backend/v3/api/iam/groups/{groupId}', groupId: serialize_path_parameter(group_id, PathParameterSpec.new('groupId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Groups retrieve.
          def groups_retrieve(group_id)
            path = interpolate_path('/backend/v3/api/iam/groups/{groupId}', groupId: serialize_path_parameter(group_id, PathParameterSpec.new('groupId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Groups update.
          def groups_update(group_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/groups/{groupId}', groupId: serialize_path_parameter(group_id, PathParameterSpec.new('groupId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Groups members list.
          def groups_members_list(group_id, page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = interpolate_path('/backend/v3/api/iam/groups/{groupId}/members', groupId: serialize_path_parameter(group_id, PathParameterSpec.new('groupId', 'simple', false)))
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

          # Groups members create.
          def groups_members_create(group_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/groups/{groupId}/members', groupId: serialize_path_parameter(group_id, PathParameterSpec.new('groupId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Groups members delete.
          def groups_members_delete(group_id, member_id)
            path = interpolate_path('/backend/v3/api/iam/groups/{groupId}/members/{memberId}', groupId: serialize_path_parameter(group_id, PathParameterSpec.new('groupId', 'simple', false)), memberId: serialize_path_parameter(member_id, PathParameterSpec.new('memberId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organization Memberships list.
          def organization_memberships_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/organization_memberships'
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

          # Organization Memberships create.
          def organization_memberships_create(body: nil)
            path = '/backend/v3/api/iam/organization_memberships'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organization Memberships update.
          def organization_memberships_update(membership_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/organization_memberships/{membershipId}', membershipId: serialize_path_parameter(membership_id, PathParameterSpec.new('membershipId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations list.
          def organizations_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/organizations'
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

          # Organizations create.
          def organizations_create(body: nil)
            path = '/backend/v3/api/iam/organizations'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations delete.
          def organizations_delete(organization_id)
            path = interpolate_path('/backend/v3/api/iam/organizations/{organizationId}', organizationId: serialize_path_parameter(organization_id, PathParameterSpec.new('organizationId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations retrieve.
          def organizations_retrieve(organization_id)
            path = interpolate_path('/backend/v3/api/iam/organizations/{organizationId}', organizationId: serialize_path_parameter(organization_id, PathParameterSpec.new('organizationId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations update.
          def organizations_update(organization_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/organizations/{organizationId}', organizationId: serialize_path_parameter(organization_id, PathParameterSpec.new('organizationId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Organizations tree retrieve.
          def organizations_tree_retrieve()
            path = '/backend/v3/api/iam/organizations/tree'
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Permissions list.
          def permissions_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/permissions'
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

          # Permissions create.
          def permissions_create(body: nil)
            path = '/backend/v3/api/iam/permissions'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Permissions delete.
          def permissions_delete(permission_id)
            path = interpolate_path('/backend/v3/api/iam/permissions/{permissionId}', permissionId: serialize_path_parameter(permission_id, PathParameterSpec.new('permissionId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Permissions retrieve.
          def permissions_retrieve(permission_id)
            path = interpolate_path('/backend/v3/api/iam/permissions/{permissionId}', permissionId: serialize_path_parameter(permission_id, PathParameterSpec.new('permissionId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Permissions update.
          def permissions_update(permission_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/permissions/{permissionId}', permissionId: serialize_path_parameter(permission_id, PathParameterSpec.new('permissionId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Policies list.
          def policies_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/policies'
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

          # Policies create.
          def policies_create(body: nil)
            path = '/backend/v3/api/iam/policies'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Policies delete.
          def policies_delete(policy_id)
            path = interpolate_path('/backend/v3/api/iam/policies/{policyId}', policyId: serialize_path_parameter(policy_id, PathParameterSpec.new('policyId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Policies retrieve.
          def policies_retrieve(policy_id)
            path = interpolate_path('/backend/v3/api/iam/policies/{policyId}', policyId: serialize_path_parameter(policy_id, PathParameterSpec.new('policyId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Policies update.
          def policies_update(policy_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/policies/{policyId}', policyId: serialize_path_parameter(policy_id, PathParameterSpec.new('policyId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Position Assignments list.
          def position_assignments_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/position_assignments'
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

          # Position Assignments create.
          def position_assignments_create(body: nil)
            path = '/backend/v3/api/iam/position_assignments'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Position Assignments update.
          def position_assignments_update(assignment_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/position_assignments/{assignmentId}', assignmentId: serialize_path_parameter(assignment_id, PathParameterSpec.new('assignmentId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Positions list.
          def positions_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/positions'
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

          # Positions create.
          def positions_create(body: nil)
            path = '/backend/v3/api/iam/positions'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Positions delete.
          def positions_delete(position_id)
            path = interpolate_path('/backend/v3/api/iam/positions/{positionId}', positionId: serialize_path_parameter(position_id, PathParameterSpec.new('positionId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Positions update.
          def positions_update(position_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/positions/{positionId}', positionId: serialize_path_parameter(position_id, PathParameterSpec.new('positionId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Role Bindings list.
          def role_bindings_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/role_bindings'
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

          # Role Bindings create.
          def role_bindings_create(body: nil)
            path = '/backend/v3/api/iam/role_bindings'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Role Bindings delete.
          def role_bindings_delete(role_binding_id)
            path = interpolate_path('/backend/v3/api/iam/role_bindings/{roleBindingId}', roleBindingId: serialize_path_parameter(role_binding_id, PathParameterSpec.new('roleBindingId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Roles list.
          def roles_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/roles'
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

          # Roles create.
          def roles_create(body: nil)
            path = '/backend/v3/api/iam/roles'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Roles delete.
          def roles_delete(role_id)
            path = interpolate_path('/backend/v3/api/iam/roles/{roleId}', roleId: serialize_path_parameter(role_id, PathParameterSpec.new('roleId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Roles retrieve.
          def roles_retrieve(role_id)
            path = interpolate_path('/backend/v3/api/iam/roles/{roleId}', roleId: serialize_path_parameter(role_id, PathParameterSpec.new('roleId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Roles update.
          def roles_update(role_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/roles/{roleId}', roleId: serialize_path_parameter(role_id, PathParameterSpec.new('roleId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Roles permissions list.
          def roles_permissions_list(role_id, page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = interpolate_path('/backend/v3/api/iam/roles/{roleId}/permissions', roleId: serialize_path_parameter(role_id, PathParameterSpec.new('roleId', 'simple', false)))
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

          # Roles permissions create.
          def roles_permissions_create(role_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/roles/{roleId}/permissions', roleId: serialize_path_parameter(role_id, PathParameterSpec.new('roleId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Roles permissions delete.
          def roles_permissions_delete(role_id, permission_id)
            path = interpolate_path('/backend/v3/api/iam/roles/{roleId}/permissions/{permissionId}', roleId: serialize_path_parameter(role_id, PathParameterSpec.new('roleId', 'simple', false)), permissionId: serialize_path_parameter(permission_id, PathParameterSpec.new('permissionId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Security Events list.
          def security_events_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/security_events'
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

          # Service Accounts list.
          def service_accounts_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/service_accounts'
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

          # Service Accounts create.
          def service_accounts_create(body: nil)
            path = '/backend/v3/api/iam/service_accounts'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Service Accounts delete.
          def service_accounts_delete(service_account_id)
            path = interpolate_path('/backend/v3/api/iam/service_accounts/{serviceAccountId}', serviceAccountId: serialize_path_parameter(service_account_id, PathParameterSpec.new('serviceAccountId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Service Accounts retrieve.
          def service_accounts_retrieve(service_account_id)
            path = interpolate_path('/backend/v3/api/iam/service_accounts/{serviceAccountId}', serviceAccountId: serialize_path_parameter(service_account_id, PathParameterSpec.new('serviceAccountId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Service Accounts update.
          def service_accounts_update(service_account_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/service_accounts/{serviceAccountId}', serviceAccountId: serialize_path_parameter(service_account_id, PathParameterSpec.new('serviceAccountId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenant Applications provision.
          def tenant_applications_provision(body: nil)
            path = '/backend/v3/api/iam/tenant_applications'
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenant Applications update.
          def tenant_applications_update(tenant_application_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/tenant_applications/{tenantApplicationId}', tenantApplicationId: serialize_path_parameter(tenant_application_id, PathParameterSpec.new('tenantApplicationId', 'simple', false)))
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenant Applications enable.
          def tenant_applications_enable(tenant_application_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/tenant_applications/{tenantApplicationId}/enable', tenantApplicationId: serialize_path_parameter(tenant_application_id, PathParameterSpec.new('tenantApplicationId', 'simple', false)))
            payload = body.respond_to?(:to_hash) ? body.to_hash : body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants list.
          def tenants_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/tenants'
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

          # Tenants create.
          def tenants_create(body: nil)
            path = '/backend/v3/api/iam/tenants'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants delete.
          def tenants_delete(tenant_id)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants retrieve.
          def tenants_retrieve(tenant_id)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants update.
          def tenants_update(tenant_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants members list.
          def tenants_members_list(tenant_id, page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}/members', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)))
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

          # Tenants members create.
          def tenants_members_create(tenant_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}/members', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants members delete.
          def tenants_members_delete(tenant_id, user_id)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}/members/{userId}', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)), userId: serialize_path_parameter(user_id, PathParameterSpec.new('userId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Tenants members update.
          def tenants_members_update(tenant_id, user_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/tenants/{tenantId}/members/{userId}', tenantId: serialize_path_parameter(tenant_id, PathParameterSpec.new('tenantId', 'simple', false)), userId: serialize_path_parameter(user_id, PathParameterSpec.new('userId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users list.
          def users_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/users'
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

          # Users create.
          def users_create(body: nil)
            path = '/backend/v3/api/iam/users'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users delete.
          def users_delete(user_id)
            path = interpolate_path('/backend/v3/api/iam/users/{userId}', userId: serialize_path_parameter(user_id, PathParameterSpec.new('userId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users retrieve.
          def users_retrieve(user_id)
            path = interpolate_path('/backend/v3/api/iam/users/{userId}', userId: serialize_path_parameter(user_id, PathParameterSpec.new('userId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Users update.
          def users_update(user_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/users/{userId}', userId: serialize_path_parameter(user_id, PathParameterSpec.new('userId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

      end
    end
  end
end
