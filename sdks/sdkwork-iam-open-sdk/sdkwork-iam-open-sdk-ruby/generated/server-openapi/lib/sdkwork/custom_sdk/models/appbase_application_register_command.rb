module Sdkwork
  module CustomSdk
    module Models
      class AppbaseApplicationRegisterCommand
              # Super-admin registered application command for startup bootstrap.
              attr_accessor :auth_token, :username, :email, :phone, :password, :owner_tenant_id, :app_key, :name, :display_name, :app_type, :package_name, :bundle_id, :desktop_app_id, :version, :channel, :manifest_hash, :default_access_permissions, :config, :packages

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @auth_token = attributes['authToken']
                @username = attributes['username']
                @email = attributes['email']
                @phone = attributes['phone']
                @password = attributes['password']
                @owner_tenant_id = attributes['ownerTenantId']
                @app_key = attributes['appKey']
                @name = attributes['name']
                @display_name = attributes['displayName']
                @app_type = attributes['appType']
                @package_name = attributes['packageName']
                @bundle_id = attributes['bundleId']
                @desktop_app_id = attributes['desktopAppId']
                @version = attributes['version']
                @channel = attributes['channel']
                @manifest_hash = attributes['manifestHash']
                @default_access_permissions = attributes['defaultAccessPermissions'].is_a?(Array) ? attributes['defaultAccessPermissions'].map { |item| item } : []
                @config = attributes['config'].is_a?(Hash) ? attributes['config'] : {}
                @packages = attributes['packages'].is_a?(Array) ? attributes['packages'].map { |item| item.is_a?(Hash) ? item : {} } : []
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
                  'ownerTenantId' => @owner_tenant_id,
                  'appKey' => @app_key,
                  'name' => @name,
                  'displayName' => @display_name,
                  'appType' => @app_type,
                  'packageName' => @package_name,
                  'bundleId' => @bundle_id,
                  'desktopAppId' => @desktop_app_id,
                  'version' => @version,
                  'channel' => @channel,
                  'manifestHash' => @manifest_hash,
                  'defaultAccessPermissions' => @default_access_permissions.is_a?(Array) ? @default_access_permissions.map { |item| item } : [],
                  'config' => @config,
                  'packages' => @packages.is_a?(Array) ? @packages.map { |item| item } : [],
                }
              end
            end
    end
  end
end
