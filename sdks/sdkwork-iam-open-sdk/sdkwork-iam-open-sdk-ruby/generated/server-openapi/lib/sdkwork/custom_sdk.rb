require_relative 'sdkwork/custom_sdk/version'
require_relative 'sdkwork/custom_sdk/sdk_config'
require_relative 'sdkwork/custom_sdk/models/appbase_api_result'
require_relative 'sdkwork/custom_sdk/models/appbase_session_create_command'
require_relative 'sdkwork/custom_sdk/models/appbase_application_register_command'
require_relative 'sdkwork/custom_sdk/models/appbase_tenant_application_provision_command'
require_relative 'sdkwork/custom_sdk/models/appbase_tenant_application_update_command'
require_relative 'sdkwork/custom_sdk/models/appbase_tenant_application_enable_command'
require_relative 'sdkwork/custom_sdk/models/appbase_access_credential_create_command'
require_relative 'sdkwork/custom_sdk/models/problem_detail'
require_relative 'sdkwork/custom_sdk/models/field_error'
require_relative 'sdkwork/custom_sdk/http/client'
require_relative 'sdkwork/custom_sdk/api/base_api'
require_relative 'sdkwork/custom_sdk/api/iam_oauth'
require_relative 'sdkwork/custom_sdk/client'

module Sdkwork
  module CustomSdk
    def self.create_client(config = SdkConfig.new)
      SdkworkCustomClient.new(config)
    end
  end
end
