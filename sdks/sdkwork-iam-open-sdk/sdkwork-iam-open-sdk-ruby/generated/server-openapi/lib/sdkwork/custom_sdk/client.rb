module Sdkwork
  module CustomSdk
    class SdkworkCustomClient
      attr_reader :http, :iam_oauth
      def initialize(config)
        @http = Http::Client.new(config)
        @iam_oauth = Api::IamOauthApi.new(@http)
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
