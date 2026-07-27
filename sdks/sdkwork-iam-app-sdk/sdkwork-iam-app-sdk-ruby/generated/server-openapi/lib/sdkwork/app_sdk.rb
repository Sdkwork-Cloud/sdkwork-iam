require_relative 'sdkwork/app_sdk/version'
require_relative 'sdkwork/app_sdk/sdk_config'
require_relative 'sdkwork/app_sdk/models/sdk_work_api_response'
require_relative 'sdkwork/app_sdk/models/sdk_work_resource_data'
require_relative 'sdkwork/app_sdk/models/sdk_work_page_data'
require_relative 'sdkwork/app_sdk/models/sdk_work_command_data'
require_relative 'sdkwork/app_sdk/models/page_info'
require_relative 'sdkwork/app_sdk/models/problem_detail'
require_relative 'sdkwork/app_sdk/models/field_error'
require_relative 'sdkwork/app_sdk/models/sdk_work_resource_response'
require_relative 'sdkwork/app_sdk/models/sdk_work_list_response'
require_relative 'sdkwork/app_sdk/models/sdk_work_command_response'
require_relative 'sdkwork/app_sdk/models/wechat_mini_program_session_create_command'
require_relative 'sdkwork/app_sdk/models/appbase_session_create_command'
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
