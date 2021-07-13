export interface Role {
  type: Number;
  role: string;
}

export interface RoleData {
  roles: string[];
  issues_roles: Role[];
  issues_authorization: string[];
}

export interface RoleConfig {
  [key: string]: {
    description: string;
    issues?: Role[];
    authorization?: string[];
  }
}
