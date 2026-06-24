module Sdkwork
  module BackendSdk
    module Models
      class AppbaseTenantApplicationProvisionCommand
              # Provision a tenant application from a registered application template.
              attr_accessor :auth_token, :username, :email, :phone, :password, :tenant_id, :organization_id, :template_id, :app_key, :instance_key, :display_name, :environment, :primary_domain, :access_permissions, :runtime_config

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @auth_token = attributes['authToken']
                @username = attributes['username']
                @email = attributes['email']
                @phone = attributes['phone']
                @password = attributes['password']
                @tenant_id = attributes['tenantId']
                @organization_id = attributes['organizationId']
                @template_id = attributes['templateId']
                @app_key = attributes['appKey']
                @instance_key = attributes['instanceKey']
                @display_name = attributes['displayName']
                @environment = attributes['environment']
                @primary_domain = attributes['primaryDomain']
                @access_permissions = attributes['accessPermissions'].is_a?(Array) ? attributes['accessPermissions'].map { |item| item } : []
                @runtime_config = attributes['runtimeConfig'].is_a?(Hash) ? attributes['runtimeConfig'] : {}
              end

              def self.from_hash(data)
                return nil if data.nil?

                new(data)
              end

              def to_hash
                {
                  'authToken' => @auth_token,
                  'username' => @username,
                  'email' => @email,
                  'phone' => @phone,
                  'password' => @password,
                  'tenantId' => @tenant_id,
                  'organizationId' => @organization_id,
                  'templateId' => @template_id,
                  'appKey' => @app_key,
                  'instanceKey' => @instance_key,
                  'displayName' => @display_name,
                  'environment' => @environment,
                  'primaryDomain' => @primary_domain,
                  'accessPermissions' => @access_permissions.is_a?(Array) ? @access_permissions.map { |item| item } : [],
                  'runtimeConfig' => @runtime_config,
                }
              end
            end
    end
  end
end
