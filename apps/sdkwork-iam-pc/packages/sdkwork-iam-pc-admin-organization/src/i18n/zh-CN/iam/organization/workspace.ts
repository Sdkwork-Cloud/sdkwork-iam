import type { SdkworkIamOrganizationAdminMessages } from "../../../../types/organization-admin-messages";

export const sdkworkIamOrganizationAdminMessages: SdkworkIamOrganizationAdminMessages = {
  common: { cancel: "取消", create: "创建", edit: "编辑", operationError: "操作未能完成。", save: "保存修改" },
  departments: {
    create: "创建部门", delete: "删除", deleteDescriptionTemplate: "确定删除“{name}”吗？此操作无法撤销。", deleteTitle: "删除部门",
    emptyDescription: "创建部门以表达汇报关系和访问范围。", emptyTitle: "暂无部门", loadedMore: "已加载更多部门。",
    table: { code: "编码", department: "部门", parent: "上级部门", status: "状态" }, titleTemplate: "{name}的部门",
  },
  drawers: {
    department: {
      code: "编码", createDescription: "在当前组织内创建部门。", createTitle: "创建部门", editDescription: "更新所选部门节点。", editTitle: "编辑部门",
      name: "名称", parentId: "上级部门 ID", status: "状态",
    },
    membership: {
      createDescription: "将用户加入当前组织并配置成员属性。", createTitle: "添加组织成员", editDescription: "更新该用户的组织成员关系。", editTitle: "编辑成员关系",
      kind: "成员类型", roleCode: "角色编码", status: "状态", userId: "用户 ID",
    },
    organization: {
      code: "编码", createDescription: "创建新的组织层级节点。", createTitle: "创建组织", editDescription: "更新所选组织。", editTitle: "编辑组织",
      name: "名称", parentId: "上级组织 ID", status: "状态",
    },
  },
  memberships: {
    add: "添加成员", emptyDescription: "将用户加入当前组织并分配组织角色。", emptyTitle: "暂无组织成员", loadedMore: "已加载更多成员。",
    table: { kind: "成员类型", member: "成员", role: "角色", status: "状态" }, titleTemplate: "{name}的成员",
  },
  notices: {
    departmentCreated: "部门已创建。", departmentDeleted: "部门已删除。", departmentUpdated: "部门已更新。", loadDepartmentsError: "部门列表加载失败。",
    loadMembershipsError: "组织成员加载失败。", loadOrganizationError: "组织详情加载失败。", loadOrganizationsError: "组织列表加载失败。",
    loadPositionsError: "岗位列表加载失败。", loadRoleBindingsError: "角色绑定加载失败。", membershipCreated: "成员已添加。", membershipUpdated: "成员关系已更新。",
    organizationCreated: "组织已创建。", organizationDeleted: "组织已删除。", organizationUpdated: "组织已更新。",
  },
  organizations: {
    create: "创建组织", delete: "删除", deleteDescriptionTemplate: "确定删除“{name}”吗？此操作无法撤销。", deleteTitle: "删除组织",
    description: "统一管理组织边界、部门、成员、岗位和范围化角色分配。", edit: "编辑组织", emptyDescription: "创建组织以表达租户内的运营归属。",
    emptyTitle: "暂无组织", loadedMore: "已加载更多组织。", manage: "查看详情", searchAction: "搜索", searchLabel: "搜索组织",
    searchPlaceholder: "搜索组织名称、编码或 ID", selectedDescriptionTemplate: "组织 ID {id} · 查看组织结构和访问分配。", selectedTitleTemplate: "正在管理 {name}",
    structure: "组织结构",
    table: { code: "编码", organization: "组织", parent: "上级组织", status: "状态" }, title: "组织管理",
  },
  positions: {
    emptyDescription: "为当前组织创建的岗位会显示在这里。", emptyTitle: "暂无岗位", loadedMore: "已加载更多岗位。",
    table: { department: "部门 ID", position: "岗位", status: "状态" }, titleTemplate: "{name}的岗位",
  },
  roleBindings: {
    emptyDescription: "当前组织范围内的角色分配会显示在这里。", emptyTitle: "暂无角色绑定", loadedMore: "已加载更多角色绑定。",
    table: { principal: "主体", role: "角色 ID", scope: "范围", status: "状态" }, titleTemplate: "{name}的角色绑定",
  },
  structure: {
    back: "返回组织管理",
    descriptionTemplate: "管理{name}的部门层级和每个部门的成员归属。",
    departmentDrawer: {
      code: "编码", createDescription: "在所选层级节点下创建部门。", createTitle: "创建部门", editDescription: "更新部门信息，不改变所属组织边界。",
      editTitle: "编辑部门", name: "名称", parent: "上级部门 ID", status: "状态",
    },
    members: {
      actions: "操作", add: "添加部门成员", addDescriptionTemplate: "将{name}已有的组织成员分配到当前部门。", addTitle: "添加部门成员",
      emptyDescription: "将组织成员分配到当前所选部门。", emptyTitle: "暂无部门成员", isPrimary: "设为主部门", loadedMore: "已加载更多部门成员。",
      member: "成员", noAvailableMembers: "所有可用组织成员都已加入当前部门。", organizationMember: "组织成员", position: "岗位", primary: "主部门",
      searchAction: "搜索", searchLabel: "搜索部门成员", searchPlaceholder: "搜索成员姓名或用户 ID", setPrimary: "设为主部门", status: "状态", userId: "用户 ID",
    },
    notices: {
      assignmentCreated: "部门成员已添加。", assignmentUpdated: "部门成员关系已更新。", departmentCreated: "部门已创建。", departmentDeleted: "部门已删除。",
      departmentUpdated: "部门已更新。", loadError: "组织结构加载失败。", operationError: "组织结构操作未能完成。",
    },
    titleTemplate: "{name}的组织结构",
    tree: {
      addChild: "添加下级部门", createRoot: "创建一级部门", delete: "删除部门",
      deleteDescriptionTemplate: "确定删除“{name}”吗？存在下级部门或成员关系时，后端可能拒绝此操作。", deleteTitle: "删除部门",
      edit: "编辑部门", emptyDescription: "为当前组织创建第一个部门。", emptyTitle: "暂无部门", title: "部门结构",
    },
  },
  tabs: { departments: "部门", memberships: "成员", positions: "岗位", roleBindings: "角色绑定" },
};
