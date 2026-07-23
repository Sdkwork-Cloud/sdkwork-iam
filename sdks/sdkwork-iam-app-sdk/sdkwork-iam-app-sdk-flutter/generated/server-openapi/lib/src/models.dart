Map<String, dynamic>? _sdkworkAsMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return null;
}

List<dynamic>? _sdkworkAsList(dynamic value) {
  return value is List ? value : null;
}

class SdkWorkApiResponse {
  final int code;
  final dynamic data;
  final String traceId;

  SdkWorkApiResponse({
    required this.code,
    required this.data,
    required this.traceId
  });

  factory SdkWorkApiResponse.fromJson(Map<String, dynamic> json) {
    return SdkWorkApiResponse(
      code: (() {
        final value = json['code'];
        if (value is! int) {
          throw FormatException('SdkWorkApiResponse.code is required');
        }
        return value;
      })(),
      data: json['data'],
      traceId: (() {
        final value = json['traceId']?.toString();
        if (value == null) {
          throw FormatException('SdkWorkApiResponse.traceId is required');
        }
        return value;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class SdkWorkResourceData {
  final Map<String, dynamic> item;

  SdkWorkResourceData({
    required this.item
  });

  factory SdkWorkResourceData.fromJson(Map<String, dynamic> json) {
    return SdkWorkResourceData(
      item: (() {
        final map = _sdkworkAsMap(json['item']);
        if (map == null) {
          throw FormatException('SdkWorkResourceData.item is required');
        }
        return map;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'item': item,
    };
  }
}

class SdkWorkPageData {
  final List<Map<String, dynamic>> items;
  final PageInfo pageInfo;

  SdkWorkPageData({
    required this.items,
    required this.pageInfo
  });

  factory SdkWorkPageData.fromJson(Map<String, dynamic> json) {
    return SdkWorkPageData(
      items: (() {
        final list = _sdkworkAsList(json['items']);
        if (list == null) {
          throw FormatException('SdkWorkPageData.items is required');
        }
        return list
            .map((item) => _sdkworkAsMap(item))
            .whereType<Map<String, dynamic>>()
            .toList();
      })(),
      pageInfo: (() {
        final map = _sdkworkAsMap(json['pageInfo']);
        if (map == null) {
          throw FormatException('SdkWorkPageData.pageInfo is required');
        }
        return PageInfo.fromJson(map);
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'items': items.map((item) => item).toList(),
      'pageInfo': pageInfo.toJson(),
    };
  }
}

class SdkWorkCommandData {
  final bool accepted;
  final String? resourceId;
  final String? status;

  SdkWorkCommandData({
    required this.accepted,
    this.resourceId,
    this.status
  });

  factory SdkWorkCommandData.fromJson(Map<String, dynamic> json) {
    return SdkWorkCommandData(
      accepted: (() {
        final value = json['accepted'];
        if (value is! bool) {
          throw FormatException('SdkWorkCommandData.accepted is required');
        }
        return value;
      })(),
      resourceId: json['resourceId']?.toString(),
      status: json['status']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'accepted': accepted,
      'resourceId': resourceId,
      'status': status,
    };
  }
}

class PageInfo {
  final String mode;
  final int? page;
  final int? pageSize;
  final String? totalItems;
  final int? totalPages;
  final String? nextCursor;
  final bool? hasMore;

  PageInfo({
    required this.mode,
    this.page,
    this.pageSize,
    this.totalItems,
    this.totalPages,
    this.nextCursor,
    this.hasMore
  });

  factory PageInfo.fromJson(Map<String, dynamic> json) {
    return PageInfo(
      mode: (() {
        final value = json['mode']?.toString();
        if (value == null) {
          throw FormatException('PageInfo.mode is required');
        }
        return value;
      })(),
      page: json['page'] is int ? json['page'] : null,
      pageSize: json['pageSize'] is int ? json['pageSize'] : null,
      totalItems: json['totalItems']?.toString(),
      totalPages: json['totalPages'] is int ? json['totalPages'] : null,
      nextCursor: json['nextCursor']?.toString(),
      hasMore: json['hasMore'] is bool ? json['hasMore'] : null
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'mode': mode,
      'page': page,
      'pageSize': pageSize,
      'totalItems': totalItems,
      'totalPages': totalPages,
      'nextCursor': nextCursor,
      'hasMore': hasMore,
    };
  }
}

class ProblemDetail {
  final String type;
  final String title;
  final int status;
  final String? detail;
  final String? instance;
  final int code;
  final String traceId;
  final String? i18nKey;
  final String? locale;
  final List<FieldError>? errors;

  ProblemDetail({
    required this.type,
    required this.title,
    required this.status,
    this.detail,
    this.instance,
    required this.code,
    required this.traceId,
    this.i18nKey,
    this.locale,
    this.errors
  });

  factory ProblemDetail.fromJson(Map<String, dynamic> json) {
    return ProblemDetail(
      type: (() {
        final value = json['type']?.toString();
        if (value == null) {
          throw FormatException('ProblemDetail.type is required');
        }
        return value;
      })(),
      title: (() {
        final value = json['title']?.toString();
        if (value == null) {
          throw FormatException('ProblemDetail.title is required');
        }
        return value;
      })(),
      status: (() {
        final value = json['status'];
        if (value is! int) {
          throw FormatException('ProblemDetail.status is required');
        }
        return value;
      })(),
      detail: json['detail']?.toString(),
      instance: json['instance']?.toString(),
      code: (() {
        final value = json['code'];
        if (value is! int) {
          throw FormatException('ProblemDetail.code is required');
        }
        return value;
      })(),
      traceId: (() {
        final value = json['traceId']?.toString();
        if (value == null) {
          throw FormatException('ProblemDetail.traceId is required');
        }
        return value;
      })(),
      i18nKey: json['i18nKey']?.toString(),
      locale: json['locale']?.toString(),
      errors: (() {
        final list = _sdkworkAsList(json['errors']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => (() {
        final map = _sdkworkAsMap(item);
        return map == null ? null : FieldError.fromJson(map);
      })())
            .whereType<FieldError>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'type': type,
      'title': title,
      'status': status,
      'detail': detail,
      'instance': instance,
      'code': code,
      'traceId': traceId,
      'i18nKey': i18nKey,
      'locale': locale,
      'errors': errors?.map((item) => item.toJson()).toList(),
    };
  }
}

class FieldError {
  final String field;
  final String message;
  final int? code;
  final String? i18nKey;
  final Map<String, dynamic>? params;

  FieldError({
    required this.field,
    required this.message,
    this.code,
    this.i18nKey,
    this.params
  });

  factory FieldError.fromJson(Map<String, dynamic> json) {
    return FieldError(
      field: (() {
        final value = json['field']?.toString();
        if (value == null) {
          throw FormatException('FieldError.field is required');
        }
        return value;
      })(),
      message: (() {
        final value = json['message']?.toString();
        if (value == null) {
          throw FormatException('FieldError.message is required');
        }
        return value;
      })(),
      code: json['code'] is int ? json['code'] : null,
      i18nKey: json['i18nKey']?.toString(),
      params: (() {
        final map = _sdkworkAsMap(json['params']);
        if (map == null) {
          return null;
        }
        final result = <String, String>{};
        map.forEach((key, item) {
          final deserialized = item?.toString();
          if (deserialized is String) {
            result[key] = deserialized;
          }
        });
        return result;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'field': field,
      'message': message,
      'code': code,
      'i18nKey': i18nKey,
      'params': params?.map((key, item) => MapEntry(key, item)),
    };
  }
}

class SdkWorkResourceResponse {
  final int code;
  final dynamic data;
  final String traceId;

  SdkWorkResourceResponse({
    required this.code,
    required this.data,
    required this.traceId
  });

  factory SdkWorkResourceResponse.fromJson(Map<String, dynamic> json) {
    return SdkWorkResourceResponse(
      code: (() {
        final value = json['code'];
        if (value is! int) {
          throw FormatException('SdkWorkResourceResponse.code is required');
        }
        return value;
      })(),
      data: json['data'],
      traceId: (() {
        final value = json['traceId']?.toString();
        if (value == null) {
          throw FormatException('SdkWorkResourceResponse.traceId is required');
        }
        return value;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class SdkWorkListResponse {
  final int code;
  final dynamic data;
  final String traceId;

  SdkWorkListResponse({
    required this.code,
    required this.data,
    required this.traceId
  });

  factory SdkWorkListResponse.fromJson(Map<String, dynamic> json) {
    return SdkWorkListResponse(
      code: (() {
        final value = json['code'];
        if (value is! int) {
          throw FormatException('SdkWorkListResponse.code is required');
        }
        return value;
      })(),
      data: json['data'],
      traceId: (() {
        final value = json['traceId']?.toString();
        if (value == null) {
          throw FormatException('SdkWorkListResponse.traceId is required');
        }
        return value;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class SdkWorkCommandResponse {
  final int code;
  final dynamic data;
  final String traceId;

  SdkWorkCommandResponse({
    required this.code,
    required this.data,
    required this.traceId
  });

  factory SdkWorkCommandResponse.fromJson(Map<String, dynamic> json) {
    return SdkWorkCommandResponse(
      code: (() {
        final value = json['code'];
        if (value is! int) {
          throw FormatException('SdkWorkCommandResponse.code is required');
        }
        return value;
      })(),
      data: json['data'],
      traceId: (() {
        final value = json['traceId']?.toString();
        if (value == null) {
          throw FormatException('SdkWorkCommandResponse.traceId is required');
        }
        return value;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'data': data,
      'traceId': traceId,
    };
  }
}

class WechatMiniProgramSessionCreateCommand {
  final String jsCode;
  final String? providerCode;
  final String? surfaceCode;

  WechatMiniProgramSessionCreateCommand({
    required this.jsCode,
    this.providerCode,
    this.surfaceCode
  });

  factory WechatMiniProgramSessionCreateCommand.fromJson(Map<String, dynamic> json) {
    return WechatMiniProgramSessionCreateCommand(
      jsCode: (() {
        final value = json['jsCode']?.toString();
        if (value == null) {
          throw FormatException('WechatMiniProgramSessionCreateCommand.jsCode is required');
        }
        return value;
      })(),
      providerCode: json['providerCode']?.toString(),
      surfaceCode: json['surfaceCode']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'jsCode': jsCode,
      'providerCode': providerCode,
      'surfaceCode': surfaceCode,
    };
  }
}

class IamOauthClientCreateCommand {
  final String integrationId;
  final String providerCode;
  final String clientCode;
  final String displayName;
  final String providerClientId;
  final String? providerTenantId;

  IamOauthClientCreateCommand({
    required this.integrationId,
    required this.providerCode,
    required this.clientCode,
    required this.displayName,
    required this.providerClientId,
    this.providerTenantId
  });

  factory IamOauthClientCreateCommand.fromJson(Map<String, dynamic> json) {
    return IamOauthClientCreateCommand(
      integrationId: (() {
        final value = json['integrationId']?.toString();
        if (value == null) {
          throw FormatException('IamOauthClientCreateCommand.integrationId is required');
        }
        return value;
      })(),
      providerCode: (() {
        final value = json['providerCode']?.toString();
        if (value == null) {
          throw FormatException('IamOauthClientCreateCommand.providerCode is required');
        }
        return value;
      })(),
      clientCode: (() {
        final value = json['clientCode']?.toString();
        if (value == null) {
          throw FormatException('IamOauthClientCreateCommand.clientCode is required');
        }
        return value;
      })(),
      displayName: (() {
        final value = json['displayName']?.toString();
        if (value == null) {
          throw FormatException('IamOauthClientCreateCommand.displayName is required');
        }
        return value;
      })(),
      providerClientId: (() {
        final value = json['providerClientId']?.toString();
        if (value == null) {
          throw FormatException('IamOauthClientCreateCommand.providerClientId is required');
        }
        return value;
      })(),
      providerTenantId: json['providerTenantId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'integrationId': integrationId,
      'providerCode': providerCode,
      'clientCode': clientCode,
      'displayName': displayName,
      'providerClientId': providerClientId,
      'providerTenantId': providerTenantId,
    };
  }
}

class AppbaseSessionCreateCommand {
  final String? email;
  final String? username;
  final String? phone;
  final String? password;
  final String? externalToken;
  final String? providerKey;
  final String? tenantId;
  final String? organizationId;

  AppbaseSessionCreateCommand({
    this.email,
    this.username,
    this.phone,
    this.password,
    this.externalToken,
    this.providerKey,
    this.tenantId,
    this.organizationId
  });

  factory AppbaseSessionCreateCommand.fromJson(Map<String, dynamic> json) {
    return AppbaseSessionCreateCommand(
      email: json['email']?.toString(),
      username: json['username']?.toString(),
      phone: json['phone']?.toString(),
      password: json['password']?.toString(),
      externalToken: json['externalToken']?.toString(),
      providerKey: json['providerKey']?.toString(),
      tenantId: json['tenantId']?.toString(),
      organizationId: json['organizationId']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'email': email,
      'username': username,
      'phone': phone,
      'password': password,
      'externalToken': externalToken,
      'providerKey': providerKey,
      'tenantId': tenantId,
      'organizationId': organizationId,
    };
  }
}

class AppbaseApplicationRegisterCommand {
  final String? authToken;
  final String? username;
  final String? email;
  final String? phone;
  final String? password;
  final String? ownerTenantId;
  final String appKey;
  final String name;
  final String? displayName;
  final String appType;
  final String? packageName;
  final String? bundleId;
  final String? desktopAppId;
  final String version;
  final String? channel;
  final String? manifestHash;
  final List<String> defaultAccessPermissions;
  final Map<String, dynamic>? config;
  final List<Map<String, dynamic>>? packages;

  AppbaseApplicationRegisterCommand({
    this.authToken,
    this.username,
    this.email,
    this.phone,
    this.password,
    this.ownerTenantId,
    required this.appKey,
    required this.name,
    this.displayName,
    required this.appType,
    this.packageName,
    this.bundleId,
    this.desktopAppId,
    required this.version,
    this.channel,
    this.manifestHash,
    required this.defaultAccessPermissions,
    this.config,
    this.packages
  });

  factory AppbaseApplicationRegisterCommand.fromJson(Map<String, dynamic> json) {
    return AppbaseApplicationRegisterCommand(
      authToken: json['authToken']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      password: json['password']?.toString(),
      ownerTenantId: json['ownerTenantId']?.toString(),
      appKey: (() {
        final value = json['appKey']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApplicationRegisterCommand.appKey is required');
        }
        return value;
      })(),
      name: (() {
        final value = json['name']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApplicationRegisterCommand.name is required');
        }
        return value;
      })(),
      displayName: json['displayName']?.toString(),
      appType: (() {
        final value = json['appType']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApplicationRegisterCommand.appType is required');
        }
        return value;
      })(),
      packageName: json['packageName']?.toString(),
      bundleId: json['bundleId']?.toString(),
      desktopAppId: json['desktopAppId']?.toString(),
      version: (() {
        final value = json['version']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApplicationRegisterCommand.version is required');
        }
        return value;
      })(),
      channel: json['channel']?.toString(),
      manifestHash: json['manifestHash']?.toString(),
      defaultAccessPermissions: (() {
        final list = _sdkworkAsList(json['defaultAccessPermissions']);
        if (list == null) {
          throw FormatException('AppbaseApplicationRegisterCommand.defaultAccessPermissions is required');
        }
        return list
            .map((item) => item?.toString())
            .whereType<String>()
            .toList();
      })(),
      config: _sdkworkAsMap(json['config']),
      packages: (() {
        final list = _sdkworkAsList(json['packages']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => _sdkworkAsMap(item))
            .whereType<Map<String, dynamic>>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'authToken': authToken,
      'username': username,
      'email': email,
      'phone': phone,
      'password': password,
      'ownerTenantId': ownerTenantId,
      'appKey': appKey,
      'name': name,
      'displayName': displayName,
      'appType': appType,
      'packageName': packageName,
      'bundleId': bundleId,
      'desktopAppId': desktopAppId,
      'version': version,
      'channel': channel,
      'manifestHash': manifestHash,
      'defaultAccessPermissions': defaultAccessPermissions.map((item) => item).toList(),
      'config': config,
      'packages': packages?.map((item) => item).toList(),
    };
  }
}

class IamTenantApplicationManagementProvisionCommand {
  final String organizationId;
  final String? templateId;
  final String? appKey;
  final String instanceKey;
  final String displayName;
  final String environment;
  final String? primaryDomain;
  final List<String>? accessPermissions;

  IamTenantApplicationManagementProvisionCommand({
    required this.organizationId,
    this.templateId,
    this.appKey,
    required this.instanceKey,
    required this.displayName,
    required this.environment,
    this.primaryDomain,
    this.accessPermissions
  });

  factory IamTenantApplicationManagementProvisionCommand.fromJson(Map<String, dynamic> json) {
    return IamTenantApplicationManagementProvisionCommand(
      organizationId: (() {
        final value = json['organizationId']?.toString();
        if (value == null) {
          throw FormatException('IamTenantApplicationManagementProvisionCommand.organizationId is required');
        }
        return value;
      })(),
      templateId: json['templateId']?.toString(),
      appKey: json['appKey']?.toString(),
      instanceKey: (() {
        final value = json['instanceKey']?.toString();
        if (value == null) {
          throw FormatException('IamTenantApplicationManagementProvisionCommand.instanceKey is required');
        }
        return value;
      })(),
      displayName: (() {
        final value = json['displayName']?.toString();
        if (value == null) {
          throw FormatException('IamTenantApplicationManagementProvisionCommand.displayName is required');
        }
        return value;
      })(),
      environment: (() {
        final value = json['environment']?.toString();
        if (value == null) {
          throw FormatException('IamTenantApplicationManagementProvisionCommand.environment is required');
        }
        return value;
      })(),
      primaryDomain: json['primaryDomain']?.toString(),
      accessPermissions: (() {
        final list = _sdkworkAsList(json['accessPermissions']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => item?.toString())
            .whereType<String>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'organizationId': organizationId,
      'templateId': templateId,
      'appKey': appKey,
      'instanceKey': instanceKey,
      'displayName': displayName,
      'environment': environment,
      'primaryDomain': primaryDomain,
      'accessPermissions': accessPermissions?.map((item) => item).toList(),
    };
  }
}

class IamTenantApplicationManagementUpdateCommand {
  final String? primaryDomain;
  final List<String>? accessPermissions;

  IamTenantApplicationManagementUpdateCommand({
    this.primaryDomain,
    this.accessPermissions
  });

  factory IamTenantApplicationManagementUpdateCommand.fromJson(Map<String, dynamic> json) {
    return IamTenantApplicationManagementUpdateCommand(
      primaryDomain: json['primaryDomain']?.toString(),
      accessPermissions: (() {
        final list = _sdkworkAsList(json['accessPermissions']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => item?.toString())
            .whereType<String>()
            .toList();
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'primaryDomain': primaryDomain,
      'accessPermissions': accessPermissions?.map((item) => item).toList(),
    };
  }
}

class IamTenantApplicationStatusCommand {


  IamTenantApplicationStatusCommand();

  factory IamTenantApplicationStatusCommand.fromJson(Map<String, dynamic> json) {
    return IamTenantApplicationStatusCommand();
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{};
  }
}

class AppbaseTenantApplicationProvisionCommand {
  final String? authToken;
  final String? username;
  final String? email;
  final String? phone;
  final String? password;
  final String tenantId;
  final String organizationId;
  final String? templateId;
  final String? appKey;
  final String instanceKey;
  final String displayName;
  final String environment;
  final String? primaryDomain;
  final List<String>? accessPermissions;
  final Map<String, dynamic>? runtimeConfig;

  AppbaseTenantApplicationProvisionCommand({
    this.authToken,
    this.username,
    this.email,
    this.phone,
    this.password,
    required this.tenantId,
    required this.organizationId,
    this.templateId,
    this.appKey,
    required this.instanceKey,
    required this.displayName,
    required this.environment,
    this.primaryDomain,
    this.accessPermissions,
    this.runtimeConfig
  });

  factory AppbaseTenantApplicationProvisionCommand.fromJson(Map<String, dynamic> json) {
    return AppbaseTenantApplicationProvisionCommand(
      authToken: json['authToken']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      password: json['password']?.toString(),
      tenantId: (() {
        final value = json['tenantId']?.toString();
        if (value == null) {
          throw FormatException('AppbaseTenantApplicationProvisionCommand.tenantId is required');
        }
        return value;
      })(),
      organizationId: (() {
        final value = json['organizationId']?.toString();
        if (value == null) {
          throw FormatException('AppbaseTenantApplicationProvisionCommand.organizationId is required');
        }
        return value;
      })(),
      templateId: json['templateId']?.toString(),
      appKey: json['appKey']?.toString(),
      instanceKey: (() {
        final value = json['instanceKey']?.toString();
        if (value == null) {
          throw FormatException('AppbaseTenantApplicationProvisionCommand.instanceKey is required');
        }
        return value;
      })(),
      displayName: (() {
        final value = json['displayName']?.toString();
        if (value == null) {
          throw FormatException('AppbaseTenantApplicationProvisionCommand.displayName is required');
        }
        return value;
      })(),
      environment: (() {
        final value = json['environment']?.toString();
        if (value == null) {
          throw FormatException('AppbaseTenantApplicationProvisionCommand.environment is required');
        }
        return value;
      })(),
      primaryDomain: json['primaryDomain']?.toString(),
      accessPermissions: (() {
        final list = _sdkworkAsList(json['accessPermissions']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => item?.toString())
            .whereType<String>()
            .toList();
      })(),
      runtimeConfig: _sdkworkAsMap(json['runtimeConfig'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'authToken': authToken,
      'username': username,
      'email': email,
      'phone': phone,
      'password': password,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'templateId': templateId,
      'appKey': appKey,
      'instanceKey': instanceKey,
      'displayName': displayName,
      'environment': environment,
      'primaryDomain': primaryDomain,
      'accessPermissions': accessPermissions?.map((item) => item).toList(),
      'runtimeConfig': runtimeConfig,
    };
  }
}

class AppbaseTenantApplicationUpdateCommand {
  final String? authToken;
  final String? username;
  final String? email;
  final String? phone;
  final String? password;
  final String? primaryDomain;
  final Map<String, dynamic>? domainConfig;
  final List<String>? accessPermissions;
  final Map<String, dynamic>? runtimeConfig;

  AppbaseTenantApplicationUpdateCommand({
    this.authToken,
    this.username,
    this.email,
    this.phone,
    this.password,
    this.primaryDomain,
    this.domainConfig,
    this.accessPermissions,
    this.runtimeConfig
  });

  factory AppbaseTenantApplicationUpdateCommand.fromJson(Map<String, dynamic> json) {
    return AppbaseTenantApplicationUpdateCommand(
      authToken: json['authToken']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      password: json['password']?.toString(),
      primaryDomain: json['primaryDomain']?.toString(),
      domainConfig: _sdkworkAsMap(json['domainConfig']),
      accessPermissions: (() {
        final list = _sdkworkAsList(json['accessPermissions']);
        if (list == null) {
          return null;
        }
        return list
            .map((item) => item?.toString())
            .whereType<String>()
            .toList();
      })(),
      runtimeConfig: _sdkworkAsMap(json['runtimeConfig'])
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'authToken': authToken,
      'username': username,
      'email': email,
      'phone': phone,
      'password': password,
      'primaryDomain': primaryDomain,
      'domainConfig': domainConfig,
      'accessPermissions': accessPermissions?.map((item) => item).toList(),
      'runtimeConfig': runtimeConfig,
    };
  }
}

class AppbaseTenantApplicationEnableCommand {
  final String? authToken;
  final String? username;
  final String? email;
  final String? phone;
  final String? password;

  AppbaseTenantApplicationEnableCommand({
    this.authToken,
    this.username,
    this.email,
    this.phone,
    this.password
  });

  factory AppbaseTenantApplicationEnableCommand.fromJson(Map<String, dynamic> json) {
    return AppbaseTenantApplicationEnableCommand(
      authToken: json['authToken']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      password: json['password']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'authToken': authToken,
      'username': username,
      'email': email,
      'phone': phone,
      'password': password,
    };
  }
}

class AppbaseAccessCredentialCreateCommand {
  final String? authToken;
  final String? username;
  final String? email;
  final String? phone;
  final String? password;
  final String tenantId;
  final String organizationId;
  final String? tenantApplicationId;
  final String? appId;
  final String? instanceKey;

  AppbaseAccessCredentialCreateCommand({
    this.authToken,
    this.username,
    this.email,
    this.phone,
    this.password,
    required this.tenantId,
    required this.organizationId,
    this.tenantApplicationId,
    this.appId,
    this.instanceKey
  });

  factory AppbaseAccessCredentialCreateCommand.fromJson(Map<String, dynamic> json) {
    return AppbaseAccessCredentialCreateCommand(
      authToken: json['authToken']?.toString(),
      username: json['username']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      password: json['password']?.toString(),
      tenantId: (() {
        final value = json['tenantId']?.toString();
        if (value == null) {
          throw FormatException('AppbaseAccessCredentialCreateCommand.tenantId is required');
        }
        return value;
      })(),
      organizationId: (() {
        final value = json['organizationId']?.toString();
        if (value == null) {
          throw FormatException('AppbaseAccessCredentialCreateCommand.organizationId is required');
        }
        return value;
      })(),
      tenantApplicationId: json['tenantApplicationId']?.toString(),
      appId: json['appId']?.toString(),
      instanceKey: json['instanceKey']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'authToken': authToken,
      'username': username,
      'email': email,
      'phone': phone,
      'password': password,
      'tenantId': tenantId,
      'organizationId': organizationId,
      'tenantApplicationId': tenantApplicationId,
      'appId': appId,
      'instanceKey': instanceKey,
    };
  }
}

class ServiceAccountCredentialCreateCommand {
  final String tenantApplicationId;
  final String? expiresAt;

  ServiceAccountCredentialCreateCommand({
    required this.tenantApplicationId,
    this.expiresAt
  });

  factory ServiceAccountCredentialCreateCommand.fromJson(Map<String, dynamic> json) {
    return ServiceAccountCredentialCreateCommand(
      tenantApplicationId: (() {
        final value = json['tenantApplicationId']?.toString();
        if (value == null) {
          throw FormatException('ServiceAccountCredentialCreateCommand.tenantApplicationId is required');
        }
        return value;
      })(),
      expiresAt: json['expiresAt']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'tenantApplicationId': tenantApplicationId,
      'expiresAt': expiresAt,
    };
  }
}

class ServiceAccountCredentialRevokeCommand {


  ServiceAccountCredentialRevokeCommand();

  factory ServiceAccountCredentialRevokeCommand.fromJson(Map<String, dynamic> json) {
    return ServiceAccountCredentialRevokeCommand();
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{};
  }
}

class ServiceAccountTokenExchangeCommand {
  final String clientId;
  final String clientSecret;

  ServiceAccountTokenExchangeCommand({
    required this.clientId,
    required this.clientSecret
  });

  factory ServiceAccountTokenExchangeCommand.fromJson(Map<String, dynamic> json) {
    return ServiceAccountTokenExchangeCommand(
      clientId: (() {
        final value = json['clientId']?.toString();
        if (value == null) {
          throw FormatException('ServiceAccountTokenExchangeCommand.clientId is required');
        }
        return value;
      })(),
      clientSecret: (() {
        final value = json['clientSecret']?.toString();
        if (value == null) {
          throw FormatException('ServiceAccountTokenExchangeCommand.clientSecret is required');
        }
        return value;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'clientId': clientId,
      'clientSecret': clientSecret,
    };
  }
}
