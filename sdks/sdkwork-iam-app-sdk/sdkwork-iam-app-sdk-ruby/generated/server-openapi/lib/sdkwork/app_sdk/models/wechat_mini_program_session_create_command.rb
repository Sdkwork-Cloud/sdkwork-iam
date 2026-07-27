module Sdkwork
  module AppSdk
    module Models
      class WechatMiniProgramSessionCreateCommand
              # One-time WeChat Mini Program login-code exchange command.
              attr_accessor :js_code, :provider_code, :surface_code

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @js_code = attributes['jsCode']
                @provider_code = attributes['providerCode']
                @surface_code = attributes['surfaceCode']
              end

              def self.from_hash(data)
                return nil if data.nil?

                new(data)
              end

              def to_hash
                {
                  'jsCode' => @js_code,
                  'providerCode' => @provider_code,
                  'surfaceCode' => @surface_code,
                }
              end
            end
    end
  end
end
