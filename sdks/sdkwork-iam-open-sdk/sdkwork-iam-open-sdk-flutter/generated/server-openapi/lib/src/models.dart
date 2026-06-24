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

class AppbaseApiResult {
  final String code;
  final String message;
  final String requestId;
  final Map<String, dynamic> data;

  AppbaseApiResult({
    required this.code,
    required this.message,
    required this.requestId,
    required this.data
  });

  factory AppbaseApiResult.fromJson(Map<String, dynamic> json) {
    return AppbaseApiResult(
      code: (() {
        final value = json['code']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApiResult.code is required');
        }
        return value;
      })(),
      message: (() {
        final value = json['message']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApiResult.message is required');
        }
        return value;
      })(),
      requestId: (() {
        final value = json['requestId']?.toString();
        if (value == null) {
          throw FormatException('AppbaseApiResult.requestId is required');
        }
        return value;
      })(),
      data: (() {
        final map = _sdkworkAsMap(json['data']);
        if (map == null) {
          throw FormatException('AppbaseApiResult.data is required');
        }
        return map;
      })()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'code': code,
      'message': message,
      'requestId': requestId,
      'data': data,
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

class ProblemDetail {
  final String type;
  final String title;
  final int status;
  final String? detail;
  final String? instance;
  final String? code;
  final String? traceId;
  final String? requestId;
  final List<FieldError>? errors;

  ProblemDetail({
    required this.type,
    required this.title,
    required this.status,
    this.detail,
    this.instance,
    this.code,
    this.traceId,
    this.requestId,
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
      code: json['code']?.toString(),
      traceId: json['traceId']?.toString(),
      requestId: json['requestId']?.toString(),
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
      'requestId': requestId,
      'errors': errors?.map((item) => item.toJson()).toList(),
    };
  }
}

class FieldError {
  final String field;
  final String message;
  final String? code;

  FieldError({
    required this.field,
    required this.message,
    this.code
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
      code: json['code']?.toString()
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'field': field,
      'message': message,
      'code': code,
    };
  }
}
