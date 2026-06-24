module Sdkwork
  module BackendSdk
    module Models
      class AppbaseApiResult
              attr_accessor :code, :message, :request_id, :data
      
              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @code = attributes['code']
                @message = attributes['message']
                @request_id = attributes['requestId']
                @data = attributes['data'].is_a?(Hash) ? attributes['data'] : {}
              end
      
              def self.from_hash(data)
                return nil if data.nil?
      
                new(data)
              end
      
              def to_hash
                {
                  'code' => @code,
                  'message' => @message,
                  'requestId' => @request_id,
                  'data' => @data,
                }
              end
            end
    end
  end
end
