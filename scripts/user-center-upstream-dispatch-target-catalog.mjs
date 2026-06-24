export const USER_CENTER_UPSTREAM_DISPATCH_TARGETS_ENV_KEY =
  "SDKWORK_USER_CENTER_UPSTREAM_DISPATCH_TARGETS";
export const USER_CENTER_UPSTREAM_DISPATCH_TARGETS = [];
export const USER_CENTER_UPSTREAM_DISPATCH_DEFAULT_WORKFLOW =
  "user-center-upstream-sync";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseTargetSegment(segment) {
  const normalizedSegment = normalizeText(segment);
  if (!normalizedSegment) {
    return null;
  }

  const [id, repository, workflow] = normalizedSegment
    .split("|")
    .map((item) => normalizeText(item));
  if (!id || !repository) {
    throw new Error(
      "user-center upstream dispatch targets must use id|owner/repository|workflow entries",
    );
  }

  return {
    id,
    repository,
    workflow: workflow || USER_CENTER_UPSTREAM_DISPATCH_DEFAULT_WORKFLOW,
  };
}

export function parseUserCenterUpstreamDispatchTargets(value) {
  return normalizeText(value)
    .split(",")
    .map((segment) => parseTargetSegment(segment))
    .filter(Boolean);
}

function cloneTarget(target) {
  return {
    ...target,
  };
}

export function listUserCenterUpstreamDispatchTargets(
  value = process.env[USER_CENTER_UPSTREAM_DISPATCH_TARGETS_ENV_KEY],
) {
  const configuredTargets = parseUserCenterUpstreamDispatchTargets(value);
  const targets = configuredTargets.length
    ? configuredTargets
    : USER_CENTER_UPSTREAM_DISPATCH_TARGETS;

  return targets.map((target) => cloneTarget(target));
}

export function findUserCenterUpstreamDispatchTarget(
  targetId,
  value = process.env[USER_CENTER_UPSTREAM_DISPATCH_TARGETS_ENV_KEY],
) {
  const target = listUserCenterUpstreamDispatchTargets(value).find(
    (candidate) => candidate.id === targetId,
  );
  if (!target) {
    throw new Error(`missing user-center upstream dispatch target: ${targetId}`);
  }

  return cloneTarget(target);
}
