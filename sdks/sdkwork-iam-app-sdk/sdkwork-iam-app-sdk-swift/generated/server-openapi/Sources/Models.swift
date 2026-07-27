import Foundation

public struct SdkWorkApiResponse: Codable {
    public let code: Int?
    public let data: Any?
    public let traceId: String?


    public init(code: Int? = nil, data: Any? = nil, traceId: String? = nil) {
        self.code = code
        self.data = data
        self.traceId = traceId
    }
}

public struct SdkWorkResourceData: Codable {
    public let item: [String: Any]?


    public init(item: [String: Any]? = nil) {
        self.item = item
    }
}

public struct SdkWorkPageData: Codable {
    public let items: [[String: Any]]?
    public let pageInfo: PageInfo?


    public init(items: [[String: Any]]? = nil, pageInfo: PageInfo? = nil) {
        self.items = items
        self.pageInfo = pageInfo
    }
}

public struct SdkWorkCommandData: Codable {
    public let accepted: Bool?
    public let resourceId: String?
    public let status: String?


    public init(accepted: Bool? = nil, resourceId: String? = nil, status: String? = nil) {
        self.accepted = accepted
        self.resourceId = resourceId
        self.status = status
    }
}

public struct PageInfo: Codable {
    public let mode: String?
    public let page: Int?
    public let pageSize: Int?
    public let totalItems: String?
    public let totalPages: Int?
    public let nextCursor: String?
    public let hasMore: Bool?


    public init(mode: String? = nil, page: Int? = nil, pageSize: Int? = nil, totalItems: String? = nil, totalPages: Int? = nil, nextCursor: String? = nil, hasMore: Bool? = nil) {
        self.mode = mode
        self.page = page
        self.pageSize = pageSize
        self.totalItems = totalItems
        self.totalPages = totalPages
        self.nextCursor = nextCursor
        self.hasMore = hasMore
    }
}

public struct ProblemDetail: Codable {
    public let type: String?
    public let title: String?
    public let status: Int?
    public let detail: String?
    public let instance: String?
    public let code: Int?
    public let traceId: String?
    public let i18nKey: String?
    public let locale: String?
    public let errors: [FieldError]?


    public init(type: String? = nil, title: String? = nil, status: Int? = nil, detail: String? = nil, instance: String? = nil, code: Int? = nil, traceId: String? = nil, i18nKey: String? = nil, locale: String? = nil, errors: [FieldError]? = nil) {
        self.type = type
        self.title = title
        self.status = status
        self.detail = detail
        self.instance = instance
        self.code = code
        self.traceId = traceId
        self.i18nKey = i18nKey
        self.locale = locale
        self.errors = errors
    }
}

public struct FieldError: Codable {
    public let field: String?
    public let message: String?
    public let code: Int?
    public let i18nKey: String?
    public let params: [String: String]?


    public init(field: String? = nil, message: String? = nil, code: Int? = nil, i18nKey: String? = nil, params: [String: String]? = nil) {
        self.field = field
        self.message = message
        self.code = code
        self.i18nKey = i18nKey
        self.params = params
    }
}

public struct SdkWorkResourceResponse: Codable {
    public let code: Int?
    public let data: Any?
    public let traceId: String?


    public init(code: Int? = nil, data: Any? = nil, traceId: String? = nil) {
        self.code = code
        self.data = data
        self.traceId = traceId
    }
}

public struct SdkWorkListResponse: Codable {
    public let code: Int?
    public let data: Any?
    public let traceId: String?


    public init(code: Int? = nil, data: Any? = nil, traceId: String? = nil) {
        self.code = code
        self.data = data
        self.traceId = traceId
    }
}

public struct SdkWorkCommandResponse: Codable {
    public let code: Int?
    public let data: Any?
    public let traceId: String?


    public init(code: Int? = nil, data: Any? = nil, traceId: String? = nil) {
        self.code = code
        self.data = data
        self.traceId = traceId
    }
}

public struct WechatMiniProgramSessionCreateCommand: Codable {
    public let jsCode: String?
    public let providerCode: String?
    public let surfaceCode: String?


    public init(jsCode: String? = nil, providerCode: String? = nil, surfaceCode: String? = nil) {
        self.jsCode = jsCode
        self.providerCode = providerCode
        self.surfaceCode = surfaceCode
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
