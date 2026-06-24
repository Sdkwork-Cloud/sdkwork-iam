module Sdkwork
  module CustomSdk
    module Models
      class AppbaseTenantApplicationEnableCommand
              # Enable a provisioned tenant application before access credential issuance.
              attr_accessor :auth_token, :username, :email, :phone, :password

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @auth_token = attributes['authToken']
                @username = attributes['username']
                @email = attributes['email']
                @phone = attributes['phone']
                @password = attributes['password']
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
                }
              end
            end
    end
  end
end
