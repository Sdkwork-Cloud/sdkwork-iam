require_relative 'sdkwork/app_sdk/version'
require_relative 'sdkwork/app_sdk/sdk_config'
require_relative 'sdkwork/app_sdk/models/appbase_api_result'
require_relative 'sdkwork/app_sdk/models/appbase_session_create_command'
require_relative 'sdkwork/app_sdk/models/appbase_application_register_command'
require_relative 'sdkwork/app_sdk/models/appbase_tenant_application_provision_command'
require_relative 'sdkwork/app_sdk/models/appbase_tenant_application_update_command'
require_relative 'sdkwork/app_sdk/models/appbase_tenant_application_enable_command'
require_relative 'sdkwork/app_sdk/models/appbase_access_credential_create_command'
require_relative 'sdkwork/app_sdk/models/problem_detail'
require_relative 'sdkwork/app_sdk/models/field_error'
require_relative 'sdkwork/app_sdk/http/client'
require_relative 'sdkwork/app_sdk/api/base_api'
require_relative 'sdkwork/app_sdk/api/auth'
require_relative 'sdkwork/app_sdk/api/iam'
require_relative 'sdkwork/app_sdk/api/oauth'
require_relative 'sdkwork/app_sdk/api/system'
require_relative 'sdkwork/app_sdk/client'

module Sdkwork
  module AppSdk
    def self.create_client(config = SdkConfig.new)
      SdkworkAppClient.new(config)
    end
  end
end
