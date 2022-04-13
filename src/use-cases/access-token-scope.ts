import { InvalidScope } from '../utils';

export type AssertAccessTokenScope = (scope: string) => void;

export const makeAssertAccessTokenScope = ({ scopes: supportedScopes }: { scopes: string[] }) => {
  const assertAccessTokenScope: AssertAccessTokenScope = (scope) => {
    const scopes = scope.split(' ');

    if (scopes.some((scope) => !supportedScopes.includes(scope))) {
      throw new InvalidScope(scope);
    }
  };

  return { assertAccessTokenScope };
};
