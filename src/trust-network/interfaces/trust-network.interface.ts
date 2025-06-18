export interface Role {
  type: number;
  role: string;
}

export interface RoleData {
  roles: string[];
  issues_roles: Role[];
  issues_authorization: string[];
}

export interface RawRoles {
  [key: string]: {
    description?: string;
    issues?: Role[];
    authorization?: string[];
    sponsored?: boolean;
  };
}
