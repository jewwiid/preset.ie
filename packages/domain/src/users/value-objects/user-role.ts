export enum UserRole {
  CONTRIBUTOR = 'CONTRIBUTOR',
  TALENT = 'TALENT',
  ADMIN = 'ADMIN'
}

export class UserRoles {
  private roles: Set<UserRole>;

  constructor(roles: UserRole[] = []) {
    this.roles = new Set(roles);
  }

  add(role: UserRole): void {
    this.roles.add(role);
  }

  remove(role: UserRole): void {
    this.roles.delete(role);
  }

  has(role: UserRole): boolean {
    return this.roles.has(role);
  }

  isContributor(): boolean {
    return this.roles.has(UserRole.CONTRIBUTOR);
  }

  isTalent(): boolean {
    return this.roles.has(UserRole.TALENT);
  }

  isAdmin(): boolean {
    return this.roles.has(UserRole.ADMIN);
  }

  toArray(): UserRole[] {
    return Array.from(this.roles);
  }
}