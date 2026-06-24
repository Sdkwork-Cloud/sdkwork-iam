# frozen_string_literal: true

require_relative 'lib/sdkwork/custom_sdk/version'

Gem::Specification.new do |spec|
  spec.name = 'sdkwork-appbase-open-sdk'
  spec.version = Sdkwork::CustomSdk::VERSION
  spec.authors = ['SDKWork Team']
  spec.summary = 'sdkwork-appbase-open-sdk Ruby SDK'
  spec.description = 'sdkwork-appbase-open-sdk Ruby SDK'
  spec.license = 'MIT'
  spec.required_ruby_version = '>= 3.0'
  spec.files = Dir.glob('lib/**/*') + ['README.md', 'sdkwork-appbase-open-sdk.gemspec']
  spec.require_paths = ['lib']
  spec.add_dependency 'faraday', '~> 2.9'
  spec.metadata['homepage_uri'] = 'https://github.com/sdkwork/spring-ai-plus'
  spec.metadata['source_code_uri'] = 'https://github.com/sdkwork/spring-ai-plus'
end
