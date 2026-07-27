module Sdkwork
  module AppSdk
    module Models
      class FieldError
              attr_accessor :field, :message, :code, :i18n_key, :params

              def initialize(attributes = {})
                attributes = (attributes || {}).transform_keys(&:to_s)
                @field = attributes['field']
                @message = attributes['message']
                @code = attributes['code']
                @i18n_key = attributes['i18nKey']
                @params = attributes['params'].is_a?(Hash) ? attributes['params'].transform_values { |item| item } : {}
              end

              def self.from_hash(data)
                return nil if data.nil?

                new(data)
              end

              def to_hash
                {
                  'field' => @field,
                  'message' => @message,
                  'code' => @code,
                  'i18nKey' => @i18n_key,
                  'params' => @params.is_a?(Hash) ? @params.transform_values { |item| item } : {},
                }
              end
            end
    end
  end
end
