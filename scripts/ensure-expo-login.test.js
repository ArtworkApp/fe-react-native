const ensureExpoLogin = require('./ensure-expo-login');

test('starts without a login prompt when Expo CLI is already signed in', () => {
  const run = jest.fn().mockReturnValue({ status: 0 });

  expect(ensureExpoLogin(run)).toBe(0);
  expect(run).toHaveBeenCalledTimes(1);
  expect(run).toHaveBeenCalledWith(expect.any(String), ['whoami'], { stdio: 'ignore' });
});

test('opens interactive login when Expo CLI is signed out', () => {
  const run = jest.fn()
    .mockReturnValueOnce({ status: 1 })
    .mockReturnValueOnce({ status: 0 });

  expect(ensureExpoLogin(run)).toBe(0);
  expect(run).toHaveBeenNthCalledWith(2, expect.any(String), ['login'], {
    stdio: 'inherit',
  });
});

test('does not start Metro when interactive login fails', () => {
  const run = jest.fn()
    .mockReturnValueOnce({ status: 1 })
    .mockReturnValueOnce({ status: 1 });

  expect(ensureExpoLogin(run)).toBe(1);
});
