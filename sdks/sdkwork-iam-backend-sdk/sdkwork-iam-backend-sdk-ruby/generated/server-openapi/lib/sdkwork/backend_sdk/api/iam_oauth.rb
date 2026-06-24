require_relative 'base_api'
require_relative '../models/appbase_api_result'

module Sdkwork
  module BackendSdk
    module Api
      class IamOauthApi < BaseApi
          # Iam oauth account Links list.
          def account_links_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/account_links'
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

          # Iam oauth account Links update.
          def account_links_update(account_link_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/account_links/{accountLinkId}', accountLinkId: serialize_path_parameter(account_link_id, PathParameterSpec.new('accountLinkId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth callback Events list.
          def callback_events_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/callback_events'
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

          # Iam oauth claim Mappings list.
          def claim_mappings_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/claim_mappings'
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

          # Iam oauth claim Mappings create.
          def claim_mappings_create(body: nil)
            path = '/backend/v3/api/iam/oauth/claim_mappings'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth claim Mappings update.
          def claim_mappings_update(mapping_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/claim_mappings/{mappingId}', mappingId: serialize_path_parameter(mapping_id, PathParameterSpec.new('mappingId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth clients list.
          def clients_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/clients'
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

          # Iam oauth clients create.
          def clients_create(body: nil)
            path = '/backend/v3/api/iam/oauth/clients'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth clients delete.
          def clients_delete(oauth_client_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/clients/{oauthClientId}', oauthClientId: serialize_path_parameter(oauth_client_id, PathParameterSpec.new('oauthClientId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth clients retrieve.
          def clients_retrieve(oauth_client_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/clients/{oauthClientId}', oauthClientId: serialize_path_parameter(oauth_client_id, PathParameterSpec.new('oauthClientId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth clients update.
          def clients_update(oauth_client_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/clients/{oauthClientId}', oauthClientId: serialize_path_parameter(oauth_client_id, PathParameterSpec.new('oauthClientId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth diagnostic Runs list.
          def diagnostic_runs_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/diagnostic_runs'
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

          # Iam oauth diagnostic Runs create.
          def diagnostic_runs_create(body: nil)
            path = '/backend/v3/api/iam/oauth/diagnostic_runs'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth diagnostic Runs retrieve.
          def diagnostic_runs_retrieve(diagnostic_run_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/diagnostic_runs/{diagnosticRunId}', diagnosticRunId: serialize_path_parameter(diagnostic_run_id, PathParameterSpec.new('diagnosticRunId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth flow Configs list.
          def flow_configs_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/flow_configs'
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

          # Iam oauth flow Configs create.
          def flow_configs_create(body: nil)
            path = '/backend/v3/api/iam/oauth/flow_configs'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth flow Configs update.
          def flow_configs_update(flow_config_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/flow_configs/{flowConfigId}', flowConfigId: serialize_path_parameter(flow_config_id, PathParameterSpec.new('flowConfigId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth grants list.
          def grants_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/grants'
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

          # Iam oauth grants delete.
          def grants_delete(grant_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/grants/{grantId}', grantId: serialize_path_parameter(grant_id, PathParameterSpec.new('grantId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth integrations list.
          def integrations_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/integrations'
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

          # Iam oauth integrations create.
          def integrations_create(body: nil)
            path = '/backend/v3/api/iam/oauth/integrations'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth integrations delete.
          def integrations_delete(integration_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/integrations/{integrationId}', integrationId: serialize_path_parameter(integration_id, PathParameterSpec.new('integrationId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth integrations retrieve.
          def integrations_retrieve(integration_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/integrations/{integrationId}', integrationId: serialize_path_parameter(integration_id, PathParameterSpec.new('integrationId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth integrations update.
          def integrations_update(integration_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/integrations/{integrationId}', integrationId: serialize_path_parameter(integration_id, PathParameterSpec.new('integrationId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operational Resources list.
          def operational_resources_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/operational_resources'
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

          # Iam oauth operational Resources create.
          def operational_resources_create(body: nil)
            path = '/backend/v3/api/iam/oauth/operational_resources'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operational Resources delete.
          def operational_resources_delete(resource_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/operational_resources/{resourceId}', resourceId: serialize_path_parameter(resource_id, PathParameterSpec.new('resourceId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operational Resources update.
          def operational_resources_update(resource_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/operational_resources/{resourceId}', resourceId: serialize_path_parameter(resource_id, PathParameterSpec.new('resourceId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operational Resources publishes create.
          def operational_resources_publishes_create(resource_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/operational_resources/{resourceId}/publishes', resourceId: serialize_path_parameter(resource_id, PathParameterSpec.new('resourceId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operator Platforms list.
          def operator_platforms_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/operator_platforms'
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

          # Iam oauth operator Platforms create.
          def operator_platforms_create(body: nil)
            path = '/backend/v3/api/iam/oauth/operator_platforms'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operator Platforms update.
          def operator_platforms_update(operator_platform_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}', operatorPlatformId: serialize_path_parameter(operator_platform_id, PathParameterSpec.new('operatorPlatformId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth operator Platforms pre Authorizations create.
          def operator_platforms_pre_authorizations_create(operator_platform_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}/pre_authorizations', operatorPlatformId: serialize_path_parameter(operator_platform_id, PathParameterSpec.new('operatorPlatformId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth policies list.
          def policies_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/policies'
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

          # Iam oauth policies create.
          def policies_create(body: nil)
            path = '/backend/v3/api/iam/oauth/policies'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth policies update.
          def policies_update(policy_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/policies/{policyId}', policyId: serialize_path_parameter(policy_id, PathParameterSpec.new('policyId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth provider Catalog list.
          def provider_catalog_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/provider_catalog'
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

          # Iam oauth provider Catalog create.
          def provider_catalog_create(body: nil)
            path = '/backend/v3/api/iam/oauth/provider_catalog'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth provider Catalog retrieve.
          def provider_catalog_retrieve(provider_catalog_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/provider_catalog/{providerCatalogId}', providerCatalogId: serialize_path_parameter(provider_catalog_id, PathParameterSpec.new('providerCatalogId', 'simple', false)))
            options = {}

            result = @client.request('GET', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth provider Catalog update.
          def provider_catalog_update(provider_catalog_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/provider_catalog/{providerCatalogId}', providerCatalogId: serialize_path_parameter(provider_catalog_id, PathParameterSpec.new('providerCatalogId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Accounts list.
          def resource_accounts_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/resource_accounts'
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

          # Iam oauth resource Accounts create.
          def resource_accounts_create(body: nil)
            path = '/backend/v3/api/iam/oauth/resource_accounts'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Accounts update.
          def resource_accounts_update(resource_account_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}', resourceAccountId: serialize_path_parameter(resource_account_id, PathParameterSpec.new('resourceAccountId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Accounts authorization Refreshes create.
          def resource_accounts_authorization_refreshes_create(resource_account_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/authorization_refreshes', resourceAccountId: serialize_path_parameter(resource_account_id, PathParameterSpec.new('resourceAccountId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Accounts mini Program Login Checks create.
          def resource_accounts_mini_program_login_checks_create(resource_account_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/mini_program_login_checks', resourceAccountId: serialize_path_parameter(resource_account_id, PathParameterSpec.new('resourceAccountId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Accounts verifications create.
          def resource_accounts_verifications_create(resource_account_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/verifications', resourceAccountId: serialize_path_parameter(resource_account_id, PathParameterSpec.new('resourceAccountId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Authorizations list.
          def resource_authorizations_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/resource_authorizations'
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

          # Iam oauth resource Authorizations create.
          def resource_authorizations_create(body: nil)
            path = '/backend/v3/api/iam/oauth/resource_authorizations'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth resource Authorizations update.
          def resource_authorizations_update(authorization_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/resource_authorizations/{authorizationId}', authorizationId: serialize_path_parameter(authorization_id, PathParameterSpec.new('authorizationId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth scope Profiles list.
          def scope_profiles_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/scope_profiles'
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

          # Iam oauth scope Profiles create.
          def scope_profiles_create(body: nil)
            path = '/backend/v3/api/iam/oauth/scope_profiles'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth scope Profiles update.
          def scope_profiles_update(scope_profile_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/scope_profiles/{scopeProfileId}', scopeProfileId: serialize_path_parameter(scope_profile_id, PathParameterSpec.new('scopeProfileId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth secrets list.
          def secrets_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/secrets'
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

          # Iam oauth secrets create.
          def secrets_create(body: nil)
            path = '/backend/v3/api/iam/oauth/secrets'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth secrets delete.
          def secrets_delete(secret_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/secrets/{secretId}', secretId: serialize_path_parameter(secret_id, PathParameterSpec.new('secretId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth surfaces list.
          def surfaces_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/surfaces'
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

          # Iam oauth surfaces create.
          def surfaces_create(body: nil)
            path = '/backend/v3/api/iam/oauth/surfaces'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth surfaces delete.
          def surfaces_delete(surface_id)
            path = interpolate_path('/backend/v3/api/iam/oauth/surfaces/{surfaceId}', surfaceId: serialize_path_parameter(surface_id, PathParameterSpec.new('surfaceId', 'simple', false)))
            options = {}

            result = @client.request('DELETE', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth surfaces update.
          def surfaces_update(surface_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/surfaces/{surfaceId}', surfaceId: serialize_path_parameter(surface_id, PathParameterSpec.new('surfaceId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth tenant Bindings list.
          def tenant_bindings_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/tenant_bindings'
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

          # Iam oauth tenant Bindings create.
          def tenant_bindings_create(body: nil)
            path = '/backend/v3/api/iam/oauth/tenant_bindings'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth tenant Bindings update.
          def tenant_bindings_update(binding_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/tenant_bindings/{bindingId}', bindingId: serialize_path_parameter(binding_id, PathParameterSpec.new('bindingId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth webhook Configs list.
          def webhook_configs_list(page: nil, page_size: nil, cursor: nil, sort: nil, q: nil)
            path = '/backend/v3/api/iam/oauth/webhook_configs'
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

          # Iam oauth webhook Configs create.
          def webhook_configs_create(body: nil)
            path = '/backend/v3/api/iam/oauth/webhook_configs'
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('POST', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth webhook Configs update.
          def webhook_configs_update(webhook_config_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/webhook_configs/{webhookConfigId}', webhookConfigId: serialize_path_parameter(webhook_config_id, PathParameterSpec.new('webhookConfigId', 'simple', false)))
            payload = body
            options = {}
            options[:json] = payload unless payload.nil?
            result = @client.request('PATCH', path, **options)
            result.is_a?(Hash) ? Models::AppbaseApiResult.from_hash(result) : nil
          end

          # Iam oauth webhook Configs verifications create.
          def webhook_configs_verifications_create(webhook_config_id, body: nil)
            path = interpolate_path('/backend/v3/api/iam/oauth/webhook_configs/{webhookConfigId}/verifications', webhookConfigId: serialize_path_parameter(webhook_config_id, PathParameterSpec.new('webhookConfigId', 'simple', false)))
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
