import { v4 as uuidv4 } from 'uuid';
import { TaskItem } from './types';

export const mapStateToProps: any = (_, ownProps) => {
  const { getPConnect } = ownProps;

  return {
    visibility: getPConnect().getComputedVisibility(),
    getPConnect
  };
};

export const getKeyForMappedField = field => {
  if (Array.isArray(field)) {
    return field
      .map(item => {
        return getKeyForMappedField(item);
      })
      .join('__');
  }

  const pConnect = field?.getPConnect?.();

  if (pConnect?.meta?.type && pConnect?.meta?.config?.name) {
    return `${pConnect.meta.type}_${pConnect.meta.config.name}`;
  }

  // Using label as a fallback if name is not defined.
  if (pConnect?.meta?.type && pConnect?.meta?.config?.label) {
    return `${pConnect.meta.type}_${pConnect.meta.config.label}`;
  }

  return uuidv4();
};

/**
 * Extracts task items from PConnect children
 * @param children - Array of PConnect child elements
 * @returns Array of TaskItem objects
 */
export const extractTasksFromChildren = (children: any[]): TaskItem[] => {
  if (!children || !Array.isArray(children)) return [];

  return children
    .map((child, index) => {
      const pConnect = child?.getPConnect?.();
      if (!pConnect) return null;

      const config = pConnect.getConfigProps?.() || {};
      const value = pConnect.getValue?.('.') || {};

      // Extract task name from label or value
      const name = config.label || config.caption || value.name || `Task ${index + 1}`;

      // Extract status - this could come from various sources depending on Pega configuration
      const statusValue = value.status || value.pyStatusWork || config.status || 'not-started';
      const status = normalizeStatus(statusValue);

      // Extract hint text if available
      const hint = config.hint || value.hint || undefined;

      // Extract href if available (for navigation)
      const href = value.href || config.href || undefined;

      return {
        id: config.name || `task-${index}`,
        name,
        status,
        hint,
        href
      };
    })
    .filter(Boolean) as TaskItem[];
};

/**
 * Normalizes status values to GDS task list statuses
 * @param status - Raw status value from Pega
 * @returns Normalized status
 */
const normalizeStatus = (status: string): TaskItem['status'] => {
  const normalized = status?.toLowerCase() || '';

  if (normalized.includes('complete') || normalized === 'resolved-completed') {
    return 'completed';
  }
  if (normalized.includes('incomplete') || normalized === 'open') {
    return 'incomplete';
  }
  if (normalized.includes('cannot') || normalized === 'pending') {
    return 'cannot-start';
  }

  return 'not-started';
};
