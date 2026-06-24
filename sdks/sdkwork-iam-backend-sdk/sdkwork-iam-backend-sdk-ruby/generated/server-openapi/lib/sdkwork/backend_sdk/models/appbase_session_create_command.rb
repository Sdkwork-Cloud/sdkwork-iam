module Sdkwork
  module BackendSdk
    module Models
      class AppbaseSessionCreateCommand
              # Session creation command for credential login and external user-center session exchange.
              attr_accessor :email, :username, :phone, :password, :external_token, :provider_key, :tenant_id, :organization_id

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @email = attributes['email']
                @username = attributes['username']
                @phone = attributes['phone']
                @password = attributes['password']
                @external_token = attributes['externalToken']
                @provider_key = attributes['providerKey']
                @tenant_id = attributes['tenantId']
                @organization_id = attributes['organizationId']
              end

              def self.from_hash(data)
                return nil if data.nil?

                new(data)
              end

              def to_hash
                {
                  'email' => @email,
                  'username' => @username,
                  'phone' => @phone,
                  'password' => @password,
                  'externalToken' => @external_token,
                  'providerKey' => @provider_key,
                  'tenantId' => @tenant_id,
                  'organizationId' => @organization_id,
                }
              end
            end
    end
  end
end
