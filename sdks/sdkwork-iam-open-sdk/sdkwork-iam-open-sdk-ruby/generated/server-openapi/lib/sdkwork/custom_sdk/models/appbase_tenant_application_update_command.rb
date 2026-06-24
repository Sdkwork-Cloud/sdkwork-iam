module Sdkwork
  module CustomSdk
    module Models
      class AppbaseTenantApplicationUpdateCommand
              # Update tenant application access and runtime configuration.
              attr_accessor :auth_token, :username, :email, :phone, :password, :primary_domain, :domain_config, :access_permissions, :runtime_config

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @auth_token = attributes['authToken']
                @username = attributes['username']
                @email = attributes['email']
                @phone = attributes['phone']
                @password = attributes['password']
                @primary_domain = attributes['primaryDomain']
                @domain_config = attributes['domainConfig'].is_a?(Hash) ? attributes['domainConfig'] : {}
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
                  'primaryDomain' => @primary_domain,
                  'domainConfig' => @domain_config,
                  'accessPermissions' => @access_permissions.is_a?(Array) ? @access_permissions.map { |item| item } : [],
                  'runtimeConfig' => @runtime_config,
                }
              end
            end
    end
  end
end
