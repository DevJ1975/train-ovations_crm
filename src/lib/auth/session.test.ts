import { describe, expect, it } from 'vitest';

import { buildSessionUser, buildTokenUser } from './session';

describe('session mapping', () => {
  it('maps database user data into the jwt payload shape', () => {
    expect(
      buildTokenUser({
        id: 'user_1',
        name: 'Avery Admin',
        email: 'admin@trainovations.com',
        role: 'super_admin',
      }),
    ).toEqual({
      id: 'user_1',
      name: 'Avery Admin',
      email: 'admin@trainovations.com',
      role: 'super_admin',
      mustChangePassword: false,
    });
  });

  it('maps token user data into the session user shape', () => {
    expect(
      buildSessionUser({
        id: 'user_1',
        name: 'Avery Admin',
        email: 'admin@trainovations.com',
        role: 'super_admin',
        mustChangePassword: false,
      }),
    ).toEqual({
      id: 'user_1',
      name: 'Avery Admin',
      email: 'admin@trainovations.com',
      role: 'super_admin',
      mustChangePassword: false,
    });
  });
});
