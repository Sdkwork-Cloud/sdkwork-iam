require_relative 'sdkwork/backend_sdk/version'
require_relative 'sdkwork/backend_sdk/sdk_config'
require_relative 'sdkwork/backend_sdk/models/appbase_api_result'
require_relative 'sdkwork/backend_sdk/models/problem_detail'
require_relative 'sdkwork/backend_sdk/models/field_error'
require_relative 'sdkwork/backend_sdk/http/client'
require_relative 'sdkwork/backend_sdk/api/base_api'
require_relative 'sdkwork/backend_sdk/api/iam'
require_relative 'sdkwork/backend_sdk/client'

module Sdkwork
  module BackendSdk
    def self.create_client(config = SdkConfig.new)
      SdkworkBackendClient.new(config)
    end
  end
end
