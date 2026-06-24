import Foundation

public struct AppbaseApiResult: Codable {
    public let code: String?
    public let message: String?
    public let requestId: String?
    public let data: [String: Any]?


    public init(code: String? = nil, message: String? = nil, requestId: String? = nil, data: [String: Any]? = nil) {
        self.code = code
        self.message = message
        self.requestId = requestId
        self.data = data
    }
}

public struct AppbaseSessionCreateCommand: Codable {
    public let email: String?
    public let username: String?
    public let phone: String?
    public let password: String?
    public let externalToken: String?
    public let providerKey: String?
    public let tenantId: String?
    public let organizationId: String?


    public init(email: String? = nil, username: String? = nil, phone: String? = nil, password: String? = nil, externalToken: String? = nil, providerKey: String? = nil, tenantId: String? = nil, organizationId: String? = nil) {
        self.email = email
        self.username = username
        self.phone = phone
        self.password = password
        self.externalToken = externalToken
        self.providerKey = providerKey
        self.tenantId = tenantId
        self.organizationId = organizationId
    }
}

public struct AppbaseApplicationRegisterCommand: Codable {
    public let authToken: String?
    public let username: String?
    public let email: String?
    public let phone: String?
    public let password: String?
    public let ownerTenantId: String?
    public let appKey: String?
    public let name: String?
    public let displayName: String?
    public let appType: String?
    public let packageName: String?
    public let bundleId: String?
    public let desktopAppId: String?
    public let version: String?
    public let channel: String?
    public let manifestHash: String?
    public let defaultAccessPermissions: [String]?
    public let config: [String: Any]?
    public let packages: [[String: Any]]?


    public init(authToken: String? = nil, username: String? = nil, email: String? = nil, phone: String? = nil, password: String? = nil, ownerTenantId: String? = nil, appKey: String? = nil, name: String? = nil, displayName: String? = nil, appType: String? = nil, packageName: String? = nil, bundleId: String? = nil, desktopAppId: String? = nil, version: String? = nil, channel: String? = nil, manifestHash: String? = nil, defaultAccessPermissions: [String]? = nil, config: [String: Any]? = nil, packages: [[String: Any]]? = nil) {
        self.authToken = authToken
        self.username = username
        self.email = email
        self.phone = phone
        self.password = password
        self.ownerTenantId = ownerTenantId
        self.appKey = appKey
        self.name = name
        self.displayName = displayName
        self.appType = appType
        self.packageName = packageName
        self.bundleId = bundleId
        self.desktopAppId = desktopAppId
        self.version = version
        self.channel = channel
        self.manifestHash = manifestHash
        self.defaultAccessPermissions = defaultAccessPermissions
        self.config = config
        self.packages = packages
    }
}

public struct AppbaseTenantApplicationProvisionCommand: Codable {
    public let authToken: String?
    public let username: String?
    public let email: String?
    public let phone: String?
    public let password: String?
    public let tenantId: String?
    public let organizationId: String?
    public let templateId: String?
    public let appKey: String?
    public let instanceKey: String?
    public let displayName: String?
    public let environment: String?
    public let primaryDomain: String?
    public let accessPermissions: [String]?
    public let runtimeConfig: [String: Any]?


    public init(authToken: String? = nil, username: String? = nil, email: String? = nil, phone: String? = nil, password: String? = nil, tenantId: String? = nil, organizationId: String? = nil, templateId: String? = nil, appKey: String? = nil, instanceKey: String? = nil, displayName: String? = nil, environment: String? = nil, primaryDomain: String? = nil, accessPermissions: [String]? = nil, runtimeConfig: [String: Any]? = nil) {
        self.authToken = authToken
        self.username = username
        self.email = email
        self.phone = phone
        self.password = password
        self.tenantId = tenantId
        self.organizationId = organizationId
        self.templateId = templateId
        self.appKey = appKey
        self.instanceKey = instanceKey
        self.displayName = displayName
        self.environment = environment
        self.primaryDomain = primaryDomain
        self.accessPermissions = accessPermissions
        self.runtimeConfig = runtimeConfig
    }
}

public struct AppbaseTenantApplicationUpdateCommand: Codable {
    public let authToken: String?
    public let username: String?
    public let email: String?
    public let phone: String?
    public let password: String?
    public let primaryDomain: String?
    public let domainConfig: [String: Any]?
    public let accessPermissions: [String]?
    public let runtimeConfig: [String: Any]?


    public init(authToken: String? = nil, username: String? = nil, email: String? = nil, phone: String? = nil, password: String? = nil, primaryDomain: String? = nil, domainConfig: [String: Any]? = nil, accessPermissions: [String]? = nil, runtimeConfig: [String: Any]? = nil) {
        self.authToken = authToken
        self.username = username
        self.email = email
        self.phone = phone
        self.password = password
        self.primaryDomain = primaryDomain
        self.domainConfig = domainConfig
        self.accessPermissions = accessPermissions
        self.runtimeConfig = runtimeConfig
    }
}

public struct AppbaseTenantApplicationEnableCommand: Codable {
    public let authToken: String?
    public let username: String?
    public let email: String?
    public let phone: String?
    public let password: String?


    public init(authToken: String? = nil, username: String? = nil, email: String? = nil, phone: String? = nil, password: String? = nil) {
        self.authToken = authToken
        self.username = username
        self.email = email
        self.phone = phone
        self.password = password
    }
}

public struct AppbaseAccessCredentialCreateCommand: Codable {
    public let authToken: String?
    public let username: String?
    public let email: String?
    public let phone: String?
    public let password: String?
    public let tenantId: String?
    public let organizationId: String?
    public let tenantApplicationId: String?
    public let appId: String?
    public let instanceKey: String?


    public init(authToken: String? = nil, username: String? = nil, email: String? = nil, phone: String? = nil, password: String? = nil, tenantId: String? = nil, organizationId: String? = nil, tenantApplicationId: String? = nil, appId: String? = nil, instanceKey: String? = nil) {
        self.authToken = authToken
        self.username = username
        self.email = email
        self.phone = phone
        self.password = password
        self.tenantId = tenantId
        self.organizationId = organizationId
        self.tenantApplicationId = tenantApplicationId
        self.appId = appId
        self.instanceKey = instanceKey
    }
}

public struct ProblemDetail: Codable {
    public let type: String?
    public let title: String?
    public let status: Int?
    public let detail: String?
    public let instance: String?
    public let code: String?
    public let traceId: String?
    public let requestId: String?
    public let errors: [FieldError]?


    public init(type: String? = nil, title: String? = nil, status: Int? = nil, detail: String? = nil, instance: String? = nil, code: String? = nil, traceId: String? = nil, requestId: String? = nil, errors: [FieldError]? = nil) {
        self.type = type
        self.title = title
        self.status = status
        self.detail = detail
        self.instance = instance
        self.code = code
        self.traceId = traceId
        self.requestId = requestId
        self.errors = errors
    }
}

public struct FieldError: Codable {
    public let field: String?
    public let message: String?
    public let code: String?


    public init(field: String? = nil, message: String? = nil, code: String? = nil) {
        self.field = field
        self.message = message
        self.code = code
    }
}
