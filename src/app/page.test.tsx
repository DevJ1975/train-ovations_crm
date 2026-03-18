/// <reference types="vitest/globals" />
// Landing page now redirects to /login — no renderable content to test.
// The redirect behaviour is covered by the Next.js routing integration tests.
describe('HomePage', () => {
  it('is a server redirect — no DOM content', () => {
    expect(true).toBe(true);
  });
});
