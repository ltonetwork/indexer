export class Association {
  readonly recipient: string;

  readonly type: number;

  readonly hash: string;

  readonly direction: 'parent' | 'child';
}
