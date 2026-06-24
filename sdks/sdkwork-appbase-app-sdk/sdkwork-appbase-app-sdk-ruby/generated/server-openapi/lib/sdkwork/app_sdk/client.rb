module Sdkwork
  module AppSdk
    class SdkworkAppClient
      attr_reader :http, :auth, :iam, :oauth, :system
      def initialize(config)
        @http = Http::Client.new(config)
        @auth = Api::AuthApi.new(@http)
        @iam = Api::IamApi.new(@http)
        @oauth = Api::OauthApi.new(@http)
        @system = Api::SystemApi.new(@http)
      end

      def set_api_key(api_key)
        @http.set_api_key(api_key)
        self
      end

      def set_auth_token(token)
        @http.set_auth_token(token)
        self
      end

      def set_access_token(token)
        @http.set_access_token(token)
        self
      end

      def set_header(key, value)
        @http.set_header(key, value)
        self
      end
    end
  end
end
