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
